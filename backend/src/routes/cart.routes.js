const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const v = require('../validators/cart.validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getCart);
router.delete('/', ctrl.clearCart);
router.post('/items', validate({ body: v.addItem }), ctrl.addItem);
router.patch('/items/:itemId', validate({ params: v.itemParam, body: v.updateItem }), ctrl.updateItem);
router.delete('/items/:itemId', validate({ params: v.itemParam }), ctrl.removeItem);

module.exports = router;
