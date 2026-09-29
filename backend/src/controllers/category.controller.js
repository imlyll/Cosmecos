const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { uploadImage, deleteImage } = require('../utils/storage');
const { localizeCategory } = require('../utils/i18n');

const findByIdOrSlug = (idOrSlug) =>
  mongoose.isValidObjectId(idOrSlug) ? Category.findById(idOrSlug) : Category.findOne({ slug: idOrSlug });

// GET /api/categories
async function listCategories(req, res) {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    categories: categories.map((c) => ({ ...localizeCategory(c, req.lang), productCount: countMap.get(String(c._id)) || 0 })),
  });
}

// GET /api/categories/:idOrSlug
async function getCategory(req, res) {
  const category = await findByIdOrSlug(req.validatedParams.idOrSlug);
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ success: true, category: localizeCategory(category, req.lang) });
}

// POST /api/categories  (admin)
async function createCategory(req, res) {
  const data = { ...req.body };
  if (req.file) data.image = await uploadImage(req.file, 'categories');
  const category = await Category.create(data);
  res.status(201).json({ success: true, category });
}

// PUT /api/categories/:id  (admin)
async function updateCategory(req, res) {
  const category = await Category.findById(req.validatedParams.id);
  if (!category) throw ApiError.notFound('Category not found');
  if (req.body.parent && String(req.body.parent) === String(category._id)) {
    throw ApiError.badRequest('A category cannot be its own parent');
  }

  Object.assign(category, req.body);
  if (req.file) {
    const previous = category.image?.publicId;
    category.image = await uploadImage(req.file, 'categories');
    await deleteImage(previous);
  }
  await category.save();
  res.json({ success: true, category });
}

// DELETE /api/categories/:id  (admin)
async function deleteCategory(req, res) {
  const { id } = req.validatedParams;
  const [productCount, childCount] = await Promise.all([
    Product.countDocuments({ category: id }),
    Category.countDocuments({ parent: id }),
  ]);
  if (productCount || childCount) {
    throw ApiError.conflict(
      `Category still has ${productCount} product(s) and ${childCount} sub-category(ies); move them first`
    );
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw ApiError.notFound('Category not found');
  await deleteImage(category.image?.publicId);
  res.json({ success: true, message: 'Category deleted' });
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
