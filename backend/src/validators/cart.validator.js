const { z, objectId } = require('./common');

const quantity = z.coerce.number().int().min(1).max(99);

const addItem = z.object({
  productId: objectId,
  variantId: objectId.optional(),
  quantity: quantity.default(1),
});

const updateItem = z.object({ quantity });

const itemParam = z.object({ itemId: objectId });

const toggleWishlist = z.object({ productId: objectId });

const productParam = z.object({ productId: objectId });

module.exports = { addItem, updateItem, itemParam, toggleWishlist, productParam };
