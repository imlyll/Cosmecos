const { z, objectId, boolish, pagination } = require('./common');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../models/Order');
const { ROLES } = require('../models/User');

const shippingAddress = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(60),
});

const createOrder = z.object({
  shippingAddress,
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash_on_delivery'),
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(30).optional(),
  // Optional "buy now" items; when omitted the order is built from the user's cart.
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId.optional(),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50)
    .optional(),
});

const listOrders = z.object({
  ...pagination,
  status: z.enum(ORDER_STATUSES).optional(),
});

const adminListOrders = listOrders.extend({
  user: objectId.optional(),
  search: z.string().trim().max(50).optional(), // order number
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const updateStatus = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
});

const markPaid = z.object({ isPaid: boolish.default(true) });

const listUsers = z.object({
  ...pagination,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(ROLES).optional(),
  search: z.string().trim().max(80).optional(),
});

const updateUser = z
  .object({
    role: z.enum(ROLES).optional(),
    isActive: boolish.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { error: 'Nothing to update' });

module.exports = {
  createOrder,
  listOrders,
  adminListOrders,
  updateStatus,
  markPaid,
  listUsers,
  updateUser,
  userIdParam: z.object({ id: objectId }),
};
