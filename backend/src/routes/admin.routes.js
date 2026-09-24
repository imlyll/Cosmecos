const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const misc = require('../controllers/misc.controller');
const mv = require('../validators/misc.validator');
const v = require('../validators/order.validator');
const { idParam } = require('../validators/common');
const validate = require('../middleware/validate');
const { protect, isAdmin } = require('../middleware/auth');

// Every admin route requires an authenticated admin.
router.use(protect, isAdmin);

router.get('/stats', ctrl.getStats);

router.get('/orders', validate({ query: v.adminListOrders }), ctrl.listOrders);
router.patch('/orders/:id/status', validate({ params: idParam, body: v.updateStatus }), ctrl.updateOrderStatus);
router.patch('/orders/:id/payment', validate({ params: idParam, body: v.markPaid }), ctrl.updatePayment);

router.get('/users', validate({ query: v.listUsers }), ctrl.listUsers);
router.get('/users/:id', validate({ params: idParam }), ctrl.getUser);
router.patch('/users/:id', validate({ params: idParam, body: v.updateUser }), ctrl.updateUser);

router.get('/coupons', misc.listCoupons);
router.post('/coupons', validate({ body: mv.createCoupon }), misc.createCoupon);
router.patch('/coupons/:id', validate({ params: idParam, body: mv.updateCoupon }), misc.updateCoupon);
router.delete('/coupons/:id', validate({ params: idParam }), misc.deleteCoupon);

router.get('/messages', validate({ query: mv.listMessages }), misc.listMessages);
router.patch('/messages/:id/read', validate({ params: idParam }), misc.markMessageRead);

module.exports = router;
