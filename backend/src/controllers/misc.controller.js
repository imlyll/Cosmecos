const Coupon = require('../models/Coupon');
const ContactMessage = require('../models/ContactMessage');
const ApiError = require('../utils/ApiError');
const { paginate } = require('../utils/pagination');
const { getOrCreateCart, buildCartView } = require('../services/cart.service');
const { findApplicableCoupon, publicCoupon } = require('../services/coupon.service');
const { calculateTotals } = require('../services/pricing.service');

// POST /api/coupons/validate  { code } -> cart totals with the coupon applied
async function validateCoupon(req, res) {
  const cart = await buildCartView(await getOrCreateCart(req.user._id));
  if (!cart.items.length) throw ApiError.badRequest('Your cart is empty');
  const coupon = await findApplicableCoupon(req.body.code, cart.itemsPrice);
  res.json({ success: true, coupon: publicCoupon(coupon), totals: calculateTotals(cart.itemsPrice, coupon) });
}

// POST /api/contact
async function sendContactMessage(req, res) {
  await ContactMessage.create({ ...req.body, user: req.user?._id });
  res.status(201).json({ success: true, message: 'Thank you! We will get back to you shortly.' });
}

// ---------- Admin ----------

async function listCoupons(_req, res) {
  res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }) });
}

async function createCoupon(req, res) {
  res.status(201).json({ success: true, coupon: await Coupon.create(req.body) });
}

async function updateCoupon(req, res) {
  const coupon = await Coupon.findByIdAndUpdate(req.validatedParams.id, { $set: req.body }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true, coupon });
}

async function deleteCoupon(req, res) {
  const coupon = await Coupon.findByIdAndDelete(req.validatedParams.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true, message: 'Coupon deleted' });
}

async function listMessages(req, res) {
  const { page, limit } = req.validatedQuery;
  const [messages, total] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(),
  ]);
  res.json({ success: true, messages, pagination: paginate({ page, limit, total }) });
}

async function markMessageRead(req, res) {
  const message = await ContactMessage.findByIdAndUpdate(
    req.validatedParams.id,
    { $set: { isRead: true } },
    { returnDocument: 'after' }
  );
  if (!message) throw ApiError.notFound('Message not found');
  res.json({ success: true, message });
}

module.exports = {
  validateCoupon,
  sendContactMessage,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listMessages,
  markMessageRead,
};
