const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { round2 } = require('../utils/money');

/**
 * Loads a coupon and checks it applies to the given subtotal.
 * Throws a 400 with a customer-friendly message when it doesn't.
 */
async function findApplicableCoupon(code, itemsPrice) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.badRequest('This coupon code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (itemsPrice < coupon.minSubtotal) {
    throw ApiError.badRequest(`Spend at least $${coupon.minSubtotal} to use this coupon`);
  }
  return coupon;
}

/** Discount amount on the items subtotal (free-shipping coupons return 0 here). */
function discountFor(coupon, itemsPrice) {
  if (!coupon) return 0;
  let discount = 0;
  if (coupon.type === 'percent') discount = (itemsPrice * coupon.value) / 100;
  if (coupon.type === 'fixed') discount = coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return round2(Math.min(discount, itemsPrice));
}

/** Atomically consumes one use; fails if the limit was hit in the meantime. */
async function redeemCoupon(coupon) {
  const filter = { _id: coupon._id };
  if (coupon.usageLimit) filter.usedCount = { $lt: coupon.usageLimit };
  const res = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } });
  if (res.modifiedCount !== 1) throw ApiError.badRequest('This coupon has reached its usage limit');
}

const releaseCoupon = (code) => Coupon.updateOne({ code }, { $inc: { usedCount: -1 } });

const publicCoupon = (coupon) => ({
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  description: coupon.description,
});

module.exports = { findApplicableCoupon, discountFor, redeemCoupon, releaseCoupon, publicCoupon };
