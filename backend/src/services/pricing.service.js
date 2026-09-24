const { pricing } = require('../config/env');
const { round2 } = require('../utils/money');
const { discountFor } = require('./coupon.service');

/**
 * Computes discount, shipping, tax and grand total for an items subtotal.
 * The free-shipping threshold is checked against the subtotal before discount.
 */
function calculateTotals(itemsPrice, coupon = null) {
  const items = round2(itemsPrice);
  const discount = discountFor(coupon, items);
  const qualifiesForFreeShipping = items >= pricing.freeShippingThreshold || coupon?.type === 'free_shipping';
  const shippingPrice = items === 0 || qualifiesForFreeShipping ? 0 : pricing.shippingFee;
  const taxPrice = round2((items - discount) * pricing.taxRate);
  return {
    itemsPrice: items,
    discount,
    shippingPrice,
    taxPrice,
    totalPrice: round2(items - discount + shippingPrice + taxPrice),
    freeShippingThreshold: pricing.freeShippingThreshold,
    amountToFreeShipping: round2(Math.max(0, pricing.freeShippingThreshold - items)),
  };
}

/** Effective unit price for a product, or for one of its variants. */
const unitPrice = (product, variant) => (variant && variant.price != null ? variant.price : product.price);

module.exports = { calculateTotals, unitPrice };
