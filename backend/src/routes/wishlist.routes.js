const router = require('express').Router();
const ctrl = require('../controllers/wishlist.controller');
const v = require('../validators/cart.validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getWishlist);
router.delete('/', ctrl.clearWishlist);
router.post('/toggle', validate({ body: v.toggleWishlist }), ctrl.toggleWishlist);
router.delete('/:productId', validate({ params: v.productParam }), ctrl.removeFromWishlist);

module.exports = router;
