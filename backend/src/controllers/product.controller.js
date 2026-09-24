const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/ApiError');
const { paginate, escapeRegex } = require('../utils/pagination');
const { uploadImage, deleteImage } = require('../utils/storage');
const { SORTS } = require('../validators/product.validator');

const CATEGORY_FIELDS = 'name slug';

/** Resolves a category id or slug to the ids of it and its direct sub-categories. */
async function resolveCategoryIds(idOrSlug) {
  const category = mongoose.isValidObjectId(idOrSlug)
    ? await Category.findById(idOrSlug).select('_id')
    : await Category.findOne({ slug: idOrSlug }).select('_id');
  if (!category) return null;
  const children = await Category.find({ parent: category._id }).select('_id');
  return [category._id, ...children.map((c) => c._id)];
}

async function uploadFiles(files = [], altBase) {
  const uploaded = [];
  try {
    for (const file of files) {
      const { url, publicId } = await uploadImage(file, 'products');
      uploaded.push({ url, publicId, alt: altBase });
    }
    return uploaded;
  } catch (err) {
    await Promise.all(uploaded.map((img) => deleteImage(img.publicId)));
    throw err;
  }
}

async function ensureCategoryExists(categoryId) {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) {
    throw ApiError.badRequest('Category does not exist');
  }
}

// GET /api/products
async function listProducts(req, res) {
  const q = req.validatedQuery;
  const isAdmin = req.user?.role === 'admin';
  const filter = {};

  if (isAdmin && q.active !== undefined) filter.isActive = q.active;
  else if (!(isAdmin && q.includeInactive)) filter.isActive = true;

  if (q.category) {
    const ids = await resolveCategoryIds(q.category);
    if (!ids) {
      return res.json({ success: true, products: [], pagination: paginate({ ...q, total: 0 }) });
    }
    filter.category = { $in: ids };
  }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (q.brand) filter.brand = new RegExp(`^${escapeRegex(q.brand)}$`, 'i');
  if (q.tags?.length) filter.tags = { $in: q.tags };
  if (q.skinType) filter.skinTypes = { $in: [q.skinType, 'all'] };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.price = {};
    if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
  }
  if (q.inStock !== undefined) filter.stock = q.inStock ? { $gt: 0 } : 0;
  if (q.featured !== undefined) filter.isFeatured = q.featured;
  if (q.onSale) filter.$expr = { $gt: ['$compareAtPrice', '$price'] };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...SORTS[q.sort], _id: 1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('category', CATEGORY_FIELDS)
      .select('-ingredients -howToUse -description'),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, pagination: paginate({ page: q.page, limit: q.limit, total }) });
}

// GET /api/products/filters  - facet data for the shop sidebar
async function getFilterOptions(_req, res) {
  const [facets] = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $facet: {
        brands: [{ $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        tags: [{ $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 30 }],
        price: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
      },
    },
  ]);
  res.json({
    success: true,
    brands: facets.brands.map((b) => ({ name: b._id, count: b.count })),
    tags: facets.tags.map((t) => ({ name: t._id, count: t.count })),
    priceRange: { min: facets.price[0]?.min ?? 0, max: facets.price[0]?.max ?? 0 },
  });
}

// GET /api/products/:idOrSlug
async function getProduct(req, res) {
  const { idOrSlug } = req.validatedParams;
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  if (req.user?.role !== 'admin') filter.isActive = true;

  const product = await Product.findOne(filter).populate('category', CATEGORY_FIELDS);
  if (!product) throw ApiError.notFound('Product not found');

  // Same category first, then its parent category, then best sellers, until there are 4.
  const RELATED_FIELDS = 'name slug price compareAtPrice images rating brand stock variants tags category';
  const related = [];
  const exclude = () => [product._id, ...related.map((p) => p._id)];
  const parentId = product.category?._id && (await Category.findById(product.category._id).select('parent'))?.parent;
  for (const filter of [
    { category: product.category?._id },
    ...(parentId ? [{ category: parentId }] : []),
    {},
  ]) {
    if (related.length >= 4) break;
    const more = await Product.find({ ...filter, _id: { $nin: exclude() }, isActive: true })
      .sort({ sold: -1 })
      .limit(4 - related.length)
      .populate('category', CATEGORY_FIELDS)
      .select(RELATED_FIELDS);
    related.push(...more);
  }

  res.json({ success: true, product, related });
}

// POST /api/products  (admin, multipart or JSON)
async function createProduct(req, res) {
  const { imageUrls = [], ...data } = req.body;
  await ensureCategoryExists(data.category);

  const uploaded = await uploadFiles(req.files, data.name);
  try {
    const product = await Product.create({
      ...data,
      images: [...uploaded, ...imageUrls.map((img) => ({ url: img.url, alt: img.alt || data.name }))],
      createdBy: req.user._id,
    });
    await product.populate('category', CATEGORY_FIELDS);
    res.status(201).json({ success: true, product });
  } catch (err) {
    await Promise.all(uploaded.map((img) => deleteImage(img.publicId)));
    throw err;
  }
}

// PUT /api/products/:id  (admin, multipart or JSON)
async function updateProduct(req, res) {
  const product = await Product.findById(req.validatedParams.id);
  if (!product) throw ApiError.notFound('Product not found');

  const { imageUrls, removeImageIds, variants, ...fields } = req.body;
  await ensureCategoryExists(fields.category);

  Object.assign(product, fields);

  if (variants) {
    // Replace the variant list; variants sent with an _id keep their identity so
    // existing carts that reference them stay valid.
    product.variants = variants;
    if (!variants.length) product.stock = fields.stock ?? 0;
  }

  const removed = [];
  if (removeImageIds?.length) {
    const toRemove = new Set(removeImageIds.map(String));
    product.images = product.images.filter((img) => {
      if (!toRemove.has(String(img._id))) return true;
      removed.push(img);
      return false;
    });
  }

  const uploaded = await uploadFiles(req.files, product.name);
  product.images.push(...uploaded);
  if (imageUrls?.length) {
    product.images.push(...imageUrls.map((img) => ({ url: img.url, alt: img.alt || product.name })));
  }

  try {
    await product.save();
  } catch (err) {
    await Promise.all(uploaded.map((img) => deleteImage(img.publicId)));
    throw err;
  }
  // Only delete stored files once the product no longer references them.
  await Promise.all(removed.map((img) => deleteImage(img.publicId)));

  await product.populate('category', CATEGORY_FIELDS);
  res.json({ success: true, product });
}

// DELETE /api/products/:id/images/:imageId  (admin)
async function deleteProductImage(req, res) {
  const { id, imageId } = req.validatedParams;
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  const image = product.images.id(imageId);
  if (!image) throw ApiError.notFound('Image not found');

  const { publicId } = image;
  image.deleteOne();
  await product.save();
  await deleteImage(publicId);
  res.json({ success: true, images: product.images });
}

// DELETE /api/products/:id  (admin)
async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.validatedParams.id);
  if (!product) throw ApiError.notFound('Product not found');

  await Promise.all([
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    ...product.images.map((img) => deleteImage(img.publicId)),
  ]);
  // Past orders keep their item snapshots, so they are unaffected.
  res.json({ success: true, message: 'Product deleted' });
}

module.exports = {
  listProducts,
  getFilterOptions,
  getProduct,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
};
