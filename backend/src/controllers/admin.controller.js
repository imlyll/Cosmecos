const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { paginate, escapeRegex } = require('../utils/pagination');
const { releaseStock } = require('../services/stock.service');
const { releaseCoupon } = require('../services/coupon.service');

const { ORDER_STATUSES } = Order;

// Allowed status moves. Delivered and Cancelled are final.
const TRANSITIONS = {
  Pending: ['Processing', 'Shipped', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

// ---------- Orders ----------

// GET /api/admin/orders
async function listOrders(req, res) {
  const { page, limit, status, user, search, from, to } = req.validatedQuery;
  const filter = {};
  if (status) filter.status = status;
  if (user) filter.user = user;
  if (search) filter.orderNumber = new RegExp(escapeRegex(search), 'i');
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, pagination: paginate({ page, limit, total }) });
}

// PATCH /api/admin/orders/:id/status
async function updateOrderStatus(req, res) {
  const { status, note, trackingNumber } = req.body;
  const current = await Order.findById(req.validatedParams.id);
  if (!current) throw ApiError.notFound('Order not found');

  if (current.status === status) throw ApiError.badRequest(`Order is already ${status}`);
  if (!TRANSITIONS[current.status].includes(status)) {
    throw ApiError.badRequest(
      `Cannot change status from ${current.status} to ${status}. Allowed: ${
        TRANSITIONS[current.status].join(', ') || 'none'
      }`
    );
  }

  const set = { status };
  const now = new Date();
  if (status === 'Shipped') {
    set.shippedAt = now;
    if (trackingNumber) set.trackingNumber = trackingNumber;
  }
  if (status === 'Delivered') {
    set.deliveredAt = now;
    if (current.paymentMethod === 'cash_on_delivery' && !current.isPaid) {
      set.isPaid = true;
      set.paidAt = now;
    }
  }
  if (status === 'Cancelled') set.cancelledAt = now;

  // Conditional on the status we validated against, so two admins can't race.
  const order = await Order.findOneAndUpdate(
    { _id: current._id, status: current.status },
    { $set: set, $push: { statusHistory: { status, note, changedBy: req.user._id } } },
    { returnDocument: 'after' }
  ).populate('user', 'name email');
  if (!order) throw ApiError.conflict('Order was modified by someone else, please reload');

  if (status === 'Cancelled') {
    await releaseStock(order.items);
    if (order.couponCode) await releaseCoupon(order.couponCode);
  }

  res.json({ success: true, order });
}

// PATCH /api/admin/orders/:id/payment
async function updatePayment(req, res) {
  const { isPaid } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.validatedParams.id,
    { $set: { isPaid, paidAt: isPaid ? new Date() : null } },
    { returnDocument: 'after' }
  );
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, order });
}

// ---------- Users ----------

// GET /api/admin/users
async function listUsers(req, res) {
  const { page, limit, role, search } = req.validatedQuery;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  // Attach order stats for the page of users shown.
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
  ]);
  const statMap = new Map(stats.map((s) => [String(s._id), s]));

  res.json({
    success: true,
    users: users.map((u) => {
      const s = statMap.get(String(u._id));
      return { ...u.toJSON(), orderCount: s?.orderCount || 0, totalSpent: s?.totalSpent || 0 };
    }),
    pagination: paginate({ page, limit, total }),
  });
}

// GET /api/admin/users/:id
async function getUser(req, res) {
  const user = await User.findById(req.validatedParams.id);
  if (!user) throw ApiError.notFound('User not found');
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
  res.json({ success: true, user, recentOrders: orders });
}

// PATCH /api/admin/users/:id   { role?, isActive? }
async function updateUser(req, res) {
  if (String(req.validatedParams.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role or status');
  }
  const user = await User.findByIdAndUpdate(req.validatedParams.id, { $set: req.body }, { returnDocument: 'after' });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
}

// ---------- Dashboard ----------

// GET /api/admin/stats
async function getStats(_req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [userCount, productCount, statusCounts, [revenue], salesByDay, lowStock, recentOrders, topProducts] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, orders: { $sum: 1 }, avg: { $avg: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Product.find({ isActive: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(10).select('name slug stock sku'),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Product.find({ sold: { $gt: 0 } }).sort({ sold: -1 }).limit(5).select('name slug sold price images'),
    ]);

  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  statusCounts.forEach((s) => (ordersByStatus[s._id] = s.count));

  res.json({
    success: true,
    stats: {
      customers: userCount,
      products: productCount,
      orders: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
      ordersByStatus,
      revenue: Math.round((revenue?.total || 0) * 100) / 100,
      averageOrderValue: Math.round((revenue?.avg || 0) * 100) / 100,
      salesLast30Days: salesByDay.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      lowStock,
      topProducts,
      recentOrders,
    },
  });
}

module.exports = { listOrders, updateOrderStatus, updatePayment, listUsers, getUser, updateUser, getStats };
