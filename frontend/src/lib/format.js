import i18n from '../i18n';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (value) => currency.format(Number(value) || 0);

const DATE_LOCALES = { en: 'en-US', ru: 'ru-RU' };

// Browsers such as Chrome ship without Azerbaijani calendar data (Intl prints "M09"), so Azerbaijani dates
// are assembled from these names.
const AZ = {
  short: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
  long: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  weekday: ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'],
};

/**
 * Formats a date in the current UI language. Options: month 'short' | 'long', year (default true),
 * weekday, utc (read the date in UTC, for server-side day buckets).
 */
export function formatDay(value, { month = 'short', year = true, weekday = false, utc = false } = {}) {
  const d = new Date(value);
  if (i18n.resolvedLanguage === 'az') {
    const get = (part) => d[utc ? `getUTC${part}` : `get${part}`]();
    const text = `${get('Date')} ${AZ[month][get('Month')]}${year ? ` ${get('FullYear')}` : ''}`;
    return weekday ? `${AZ.weekday[get('Day')]}, ${text}` : text;
  }
  return d.toLocaleDateString(DATE_LOCALES[i18n.resolvedLanguage] || 'en-US', {
    day: 'numeric',
    month,
    ...(year && { year: 'numeric' }),
    ...(weekday && { weekday: 'short' }),
    ...(utc && { timeZone: 'UTC' }),
  });
}

/** Date in the current UI language, e.g. "Nov 24, 2020" / "24 noy 2020" / "24 нояб. 2020 г.". */
export const formatDate = (value, { month = 'short' } = {}) => formatDay(value, { month });

/** Date and time in the current UI language. */
export function formatDateTime(value) {
  const d = new Date(value);
  const time = d.toLocaleTimeString(DATE_LOCALES[i18n.resolvedLanguage] || 'en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${formatDay(d)}, ${time}`;
}

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
