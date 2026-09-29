const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const { getOrCreateCart, buildCartView } = require('../services/cart.service');

const sendCart = async (res, cart, status = 200) =>
  res.status(status).json({ success: true, cart: await buildCartView(cart, res.req.lang) });

/** Loads an active product and validates the variant choice against it. */
async function loadPurchasable(productId, variantId) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');

  if (product.variants.length) {
    if (!variantId) throw ApiError.badRequest('Please choose a variant (shade/size) for this product');
    const variant = product.variants.id(variantId);
    if (!variant) throw ApiError.badRequest('Selected variant does not exist');
    return { product, variant, available: variant.stock };
  }
  if (variantId) throw ApiError.badRequest('This product has no variants');
  return { product, variant: null, available: product.stock };
}

const sameLine = (item, productId, variantId) =>
  String(item.product) === String(productId) && String(item.variantId || '') === String(variantId || '');

// GET /api/cart
async function getCart(req, res) {
  await sendCart(res, await getOrCreateCart(req.user._id));
}

// POST /api/cart/items
async function addItem(req, res) {
  const { productId, variantId, quantity } = req.body;
  const { available } = await loadPurchasable(productId, variantId);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => sameLine(item, productId, variantId));
  const newQty = (existing?.quantity || 0) + quantity;

  if (newQty > available) {
    throw ApiError.badRequest(`Only ${available} item(s) in stock`, [{ field: 'quantity', available }]);
  }

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, variantId: variantId || null, quantity });

  await cart.save();
  await sendCart(res, cart, existing ? 200 : 201);
}

// PATCH /api/cart/items/:itemId
async function updateItem(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.validatedParams.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const { available } = await loadPurchasable(item.product, item.variantId);
  if (req.body.quantity > available) {
    throw ApiError.badRequest(`Only ${available} item(s) in stock`, [{ field: 'quantity', available }]);
  }

  item.quantity = req.body.quantity;
  await cart.save();
  await sendCart(res, cart);
}

// DELETE /api/cart/items/:itemId
async function removeItem(req, res) {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.validatedParams.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  await cart.save();
  await sendCart(res, cart);
}

// DELETE /api/cart
async function clearCart(req, res) {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { returnDocument: 'after', upsert: true }
  );
  await sendCart(res, cart);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
