const Cart = require('../models/Cart');
const { calculateTotals, unitPrice } = require('./pricing.service');
const { round2 } = require('../utils/money');

const PRODUCT_FIELDS = 'name slug brand price compareAtPrice images stock variants isActive';

async function getOrCreateCart(userId) {
  return (await Cart.findOne({ user: userId })) || Cart.create({ user: userId, items: [] });
}

/**
 * Populates a cart, drops lines whose product or variant no longer exists,
 * and returns a client-ready view with live prices and availability.
 */
async function buildCartView(cart) {
  await cart.populate('items.product', PRODUCT_FIELDS);

  const valid = cart.items.filter((item) => {
    const product = item.product;
    if (!product || !product.isActive) return false;
    return !item.variantId || product.variants.id(item.variantId);
  });
  if (valid.length !== cart.items.length) {
    cart.items = valid;
    await cart.save();
  }

  const items = cart.items.map((item) => {
    const product = item.product;
    const variant = item.variantId ? product.variants.id(item.variantId) : null;
    const price = unitPrice(product, variant);
    const available = variant ? variant.stock : product.stock;
    return {
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        image: variant?.image || product.images[0]?.url || null,
        compareAtPrice: product.compareAtPrice,
      },
      variant: variant ? { _id: variant._id, name: variant.name, shade: variant.shade, size: variant.size } : null,
      quantity: item.quantity,
      unitPrice: price,
      subtotal: round2(price * item.quantity),
      availableStock: available,
      isAvailable: available >= item.quantity,
    };
  });

  const itemsPrice = items.reduce((sum, i) => sum + i.subtotal, 0);
  return {
    _id: cart._id,
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    ...calculateTotals(itemsPrice),
    updatedAt: cart.updatedAt,
  };
}

module.exports = { getOrCreateCart, buildCartView };
