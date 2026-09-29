import i18n from '../i18n';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (value) => currency.format(Number(value) || 0);

const DATE_LOCALES = { en: 'en-US', az: 'az-Latn-AZ', ru: 'ru-RU' };

/** Date in the current UI language, e.g. "Nov 24, 2020" / "24 noy 2020" / "24 нояб. 2020 г.". */
export const formatDate = (value, { month = 'short' } = {}) =>
  new Date(value).toLocaleDateString(DATE_LOCALES[i18n.resolvedLanguage] || 'en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
  });

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
