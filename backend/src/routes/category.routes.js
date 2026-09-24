const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const v = require('../validators/category.validator');
const { idParam, idOrSlugParam } = require('../validators/common');
const validate = require('../middleware/validate');
const { protect, isAdmin } = require('../middleware/auth');
const { singleImage } = require('../middleware/upload');

router.get('/', ctrl.listCategories);
router.get('/:idOrSlug', validate({ params: idOrSlugParam }), ctrl.getCategory);

router.post('/', protect, isAdmin, singleImage, validate({ body: v.createCategory }), ctrl.createCategory);
router.put(
  '/:id',
  protect,
  isAdmin,
  singleImage,
  validate({ params: idParam, body: v.updateCategory }),
  ctrl.updateCategory
);
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteCategory);

module.exports = router;
