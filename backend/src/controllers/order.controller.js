const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const { paginate } = require('../utils/pagination');
const { round2 } = require('../utils/money');
const { calculateTotals, unitPrice } = require('../services/pricing.service');
const { reserveStock, releaseStock } = require('../services/stock.service');
const { findApplicableCoupon, redeemCoupon, releaseCoupon } = require('../services/coupon.service');

// Combines duplicate product/variant lines so stock is checked on the real total.
function mergeLines(lines) {
  const merged = new Map();
  for (const { productId, variantId, quantity } of lines) {
    const key = `${productId}:${variantId || ''}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += quantity;
    else merged.set(key, { productId: String(productId), variantId: variantId ? String(variantId) : null, quantity });
  }
  return [...merged.values()];
}

/** Turns requested lines into priced order-item snapshots using current product data. */
async function buildOrderItems(lines) {
  const products = await Product.find({ _id: { $in: lines.map((l) => l.productId) }, isActive: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw ApiError.badRequest(`Product ${line.productId} is no longer available`);

    let variant = null;
    if (product.variants.length) {
      variant = line.variantId && product.variants.id(line.variantId);
      if (!variant) throw ApiError.badRequest(`Please choose a valid variant for ${product.name}`);
    } else if (line.variantId) {
      throw ApiError.badRequest(`${product.name} has no variants`);
    }

    const price = unitPrice(product, variant);
    return {
      product: product._id,
      variantId: variant?._id || null,
      name: product.name,
      variantName: variant?.name,
      image: variant?.image || product.images[0]?.url,
      price,
      quantity: line.quantity,
      subtotal: round2(price * line.quantity),
    };
  });
}

// POST /api/orders
async function createOrder(req, res) {
  const { shippingAddress, paymentMethod, notes, couponCode, items: buyNowItems } = req.body;
  const fromCart = !buyNowItems;

  let lines = buyNowItems;
  if (fromCart) {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items.length) throw ApiError.badRequest('Your cart is empty');
    lines = cart.items.map((i) => ({ productId: i.product, variantId: i.variantId, quantity: i.quantity }));
  }

  const items = await buildOrderItems(mergeLines(lines));
  const itemsPrice = items.reduce((sum, i) => sum + i.subtotal, 0);
  const coupon = couponCode ? await findApplicableCoupon(couponCode, itemsPrice) : null;
  const totals = calculateTotals(itemsPrice, coupon);

  await reserveStock(items);
  if (coupon) {
    try {
      await redeemCoupon(coupon);
    } catch (err) {
      await releaseStock(items);
      throw err;
    }
  }

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      notes,
      itemsPrice: totals.itemsPrice,
      couponCode: coupon?.code,
      discount: totals.discount,
      shippingPrice: totals.shippingPrice,
      taxPrice: totals.taxPrice,
      totalPrice: totals.totalPrice,
      statusHistory: [{ status: 'Pending', changedBy: req.user._id }],
    });
  } catch (err) {
    await releaseStock(items);
    if (coupon) await releaseCoupon(coupon.code);
    throw err;
  }

  if (fromCart) await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });

  // Remember the address for faster checkout next time.
  if (!req.user.address?.line1) {
    req.user.address = shippingAddress;
    await req.user.save();
  }

  res.status(201).json({ success: true, order });
}

// GET /api/orders   (current user's orders)
async function listMyOrders(req, res) {
  const { page, limit, status } = req.validatedQuery;
  const filter = { user: req.user._id, ...(status && { status }) };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, pagination: paginate({ page, limit, total }) });
}

// GET /api/orders/:id   (owner or admin)
async function getOrder(req, res) {
  const order = await Order.findById(req.validatedParams.id).populate('user', 'name email');
  // 404 rather than 403 so order ids of other customers can't be probed.
  if (!order || (req.user.role !== 'admin' && String(order.user?._id) !== String(req.user._id))) {
    throw ApiError.notFound('Order not found');
  }
  res.json({ success: true, order });
}

// PATCH /api/orders/:id/cancel   (owner, while not yet shipped)
async function cancelMyOrder(req, res) {
  const order = await Order.findOneAndUpdate(
    { _id: req.validatedParams.id, user: req.user._id, status: { $in: ['Pending', 'Processing'] } },
    {
      $set: { status: 'Cancelled', cancelledAt: new Date() },
      $push: { statusHistory: { status: 'Cancelled', note: 'Cancelled by customer', changedBy: req.user._id } },
    },
    { returnDocument: 'after' }
  );
  if (!order) {
    const exists = await Order.exists({ _id: req.validatedParams.id, user: req.user._id });
    if (!exists) throw ApiError.notFound('Order not found');
    throw ApiError.badRequest('Only pending or processing orders can be cancelled');
  }
  await releaseStock(order.items);
  if (order.couponCode) await releaseCoupon(order.couponCode);
  res.json({ success: true, order });
}

module.exports = { createOrder, listMyOrders, getOrder, cancelMyOrder };
