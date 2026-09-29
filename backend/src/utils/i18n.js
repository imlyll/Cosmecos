/**
 * Catalog content localisation. English lives in the regular fields; Azerbaijani and Russian are optional
 * overrides in `translations.<lang>`. The storefront asks for a language with the `X-Language` header
 * (or `?lang=`); the admin panel sends none, so it always receives and edits the original fields.
 */
const LANGS = ['en', 'az', 'ru'];
const TRANSLATED_LANGS = ['az', 'ru'];
const DEFAULT_LANG = 'en';

const PRODUCT_TEXT = ['name', 'shortDescription', 'description', 'ingredients', 'howToUse'];
const CATEGORY_TEXT = ['name', 'description'];

function requestLanguage(req) {
  const raw = req.get('x-language') || req.query?.lang || '';
  const code = String(raw).slice(0, 2).toLowerCase();
  return LANGS.includes(code) ? code : DEFAULT_LANG;
}

/** Sets req.lang for every request. */
function detectLanguage(req, res, next) {
  req.lang = requestLanguage(req);
  res.vary('X-Language');
  next();
}

const toPlain = (doc) => (doc && typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc });

/** Returns a plain copy of `doc` with its text fields in `lang` (English fields are the fallback). */
function localize(doc, lang, fields) {
  if (!doc) return doc;
  const obj = toPlain(doc);
  if (lang === DEFAULT_LANG) return obj;
  const t = obj.translations?.[lang] || {};
  for (const f of fields) if (t[f]) obj[f] = t[f];
  delete obj.translations;
  return obj;
}

const localizeCategory = (category, lang) =>
  category && typeof category === 'object' && category.name !== undefined ? localize(category, lang, CATEGORY_TEXT) : category;

function localizeProduct(product, lang) {
  const obj = localize(product, lang, PRODUCT_TEXT);
  if (obj?.category) obj.category = localizeCategory(obj.category, lang);
  return obj;
}

module.exports = {
  LANGS,
  TRANSLATED_LANGS,
  PRODUCT_TEXT,
  CATEGORY_TEXT,
  detectLanguage,
  localize,
  localizeProduct,
  localizeCategory,
};
