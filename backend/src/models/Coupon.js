const mongoose = require('mongoose');

const COUPON_TYPES = ['percent', 'fixed', 'free_shipping'];

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, min: 0, default: 0 }, // percent (0-100) or fixed amount
    minSubtotal: { type: Number, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0 }, // cap for percent coupons
    expiresAt: Date,
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
module.exports.COUPON_TYPES = COUPON_TYPES;
