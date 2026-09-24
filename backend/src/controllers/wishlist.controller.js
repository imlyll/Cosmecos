const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/ApiError');

const PRODUCT_FIELDS = 'name slug brand price compareAtPrice images rating numReviews stock variants isActive';

async function sendWishlist(res, userId, extra = {}) {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    select: PRODUCT_FIELDS,
    match: { isActive: true },
  });
  const products = (wishlist?.products || []).filter(Boolean);
  res.json({ success: true, ...extra, count: products.length, products });
}

// GET /api/wishlist
async function getWishlist(req, res) {
  await sendWishlist(res, req.user._id);
}

// POST /api/wishlist/toggle   { productId }
async function toggleWishlist(req, res) {
  const { productId } = req.body;
  if (!(await Product.exists({ _id: productId, isActive: true }))) {
    throw ApiError.notFound('Product not found');
  }

  // Try to remove first; if nothing was removed, add. Both steps are atomic.
  const removed = await Wishlist.findOneAndUpdate(
    { user: req.user._id, products: productId },
    { $pull: { products: productId } }
  );
  if (!removed) {
    await Wishlist.updateOne(
      { user: req.user._id },
      { $addToSet: { products: productId } },
      { upsert: true }
    );
  }
  await sendWishlist(res, req.user._id, { added: !removed, productId });
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res) {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.validatedParams.productId } });
  await sendWishlist(res, req.user._id);
}

// DELETE /api/wishlist
async function clearWishlist(req, res) {
  await Wishlist.updateOne({ user: req.user._id }, { $set: { products: [] } });
  await sendWishlist(res, req.user._id);
}

module.exports = { getWishlist, toggleWishlist, removeFromWishlist, clearWishlist };
