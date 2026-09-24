const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const v = require('../validators/order.validator');
const { idParam } = require('../validators/common');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', validate({ body: v.createOrder }), ctrl.createOrder);
router.get('/', validate({ query: v.listOrders }), ctrl.listMyOrders);
router.get('/:id', validate({ params: idParam }), ctrl.getOrder);
router.patch('/:id/cancel', validate({ params: idParam }), ctrl.cancelMyOrder);

module.exports = router;
