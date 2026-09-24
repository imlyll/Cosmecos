const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * Atomically adjusts stock for one line. For a decrement the update only matches
 * when enough stock is left, so concurrent checkouts cannot oversell.
 * Returns true when the document was updated.
 */
async function adjustStock({ product, variantId, quantity }, direction) {
  const delta = direction * quantity;
  const filter = { _id: product };
  const inc = { stock: delta, sold: -delta };

  if (variantId) {
    filter.variants = {
      $elemMatch: { _id: variantId, ...(delta < 0 && { stock: { $gte: quantity } }) },
    };
    inc['variants.$.stock'] = delta;
  } else if (delta < 0) {
    filter.stock = { $gte: quantity };
  }

  const res = await Product.updateOne(filter, { $inc: inc });
  return res.modifiedCount === 1;
}

/**
 * Decrements stock for every line, or none of them. Without a replica set there
 * are no multi-document transactions, so partial reservations are rolled back by hand.
 */
async function reserveStock(lines) {
  const reserved = [];
  try {
    for (const line of lines) {
      const ok = await adjustStock(line, -1);
      if (!ok) {
        const label = line.variantName ? `${line.name} (${line.variantName})` : line.name;
        throw ApiError.conflict(`Insufficient stock for ${label}`);
      }
      reserved.push(line);
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
}

async function releaseStock(lines) {
  await Promise.all(lines.map((line) => adjustStock(line, 1)));
}

module.exports = { reserveStock, releaseStock };
