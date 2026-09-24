const { z, boolish, pagination } = require('./common');
const { COUPON_TYPES } = require('../models/Coupon');

const validateCoupon = z.object({ code: z.string().trim().min(1).max(30) });

const couponFields = {
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'),
  description: z.string().trim().max(200).optional(),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().min(0).default(0),
  minSubtotal: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  expiresAt: z.coerce.date().optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  isActive: boolish.optional(),
};

const percentCheck = (v) => v.type !== 'percent' || v.value === undefined || v.value <= 100;
const percentError = { error: 'Percent coupons cannot exceed 100', path: ['value'] };

const createCoupon = z.object(couponFields).refine(percentCheck, percentError);
const updateCoupon = z.object(couponFields).partial().refine(percentCheck, percentError);

const contact = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Message should be at least 10 characters').max(3000),
});

const listMessages = z.object({ ...pagination, limit: z.coerce.number().int().min(1).max(100).default(20) });

module.exports = { validateCoupon, createCoupon, updateCoupon, contact, listMessages };
