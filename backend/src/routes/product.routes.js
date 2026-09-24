const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const v = require('../validators/product.validator');
const { idParam, idOrSlugParam } = require('../validators/common');
const validate = require('../middleware/validate');
const { protect, optionalAuth, isAdmin } = require('../middleware/auth');
const { productImages } = require('../middleware/upload');

// Public (admins get extra visibility of inactive products via optionalAuth)
router.get('/', optionalAuth, validate({ query: v.listProducts }), ctrl.listProducts);
router.get('/filters', ctrl.getFilterOptions);
router.get('/:idOrSlug', optionalAuth, validate({ params: idOrSlugParam }), ctrl.getProduct);

// Admin. Multer runs before validation so multipart fields are on req.body.
router.post('/', protect, isAdmin, productImages, validate({ body: v.createProduct }), ctrl.createProduct);
router.put(
  '/:id',
  protect,
  isAdmin,
  productImages,
  validate({ params: idParam, body: v.updateProduct }),
  ctrl.updateProduct
);
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteProduct);
router.delete(
  '/:id/images/:imageId',
  protect,
  isAdmin,
  validate({ params: v.imageParams }),
  ctrl.deleteProductImage
);

module.exports = router;
