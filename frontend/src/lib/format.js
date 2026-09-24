const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (value) => currency.format(Number(value) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const discountPercent = (price, compareAtPrice) =>
  compareAtPrice && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;

/** Lowest and highest price across a product's variants (or the product price). */
export function priceRange(product) {
  const prices = product.variants?.length
    ? product.variants.map((v) => v.price ?? product.price)
    : [product.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export const isNewProduct = (product) => product.tags?.includes('new');
