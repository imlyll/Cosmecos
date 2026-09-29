const { z, objectId, fromJsonString, boolish, stringList, pagination } = require('./common');
const { SKIN_TYPES } = require('../models/Product');

const money = z.coerce.number().min(0).max(1_000_000);
// Optional field that an admin can clear: '' (from a form) or null removes the value.
const clearable = (schema) => z.preprocess((v) => (v === '' || v === 'null' ? null : v), schema.nullable());

const variant = z.object({
  _id: objectId.optional(), // present when editing an existing variant
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().max(60).optional(),
  shade: z.string().trim().max(60).optional(),
  colorHex: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'colorHex must be a hex color like #C08081')
    .optional(),
  size: z.string().trim().max(30).optional(),
  price: money.optional(),
  stock: z.coerce.number().int().min(0).default(0),
  image: z.url().optional(),
});

const imageUrl = z.object({
  url: z.url(),
  alt: z.string().trim().max(150).optional(),
});

// Per-language overrides; empty strings mean "use the English text".
const productText = z.object({
  name: z.string().trim().max(150).optional(),
  shortDescription: z.string().trim().max(600).optional(),
  description: z.string().trim().max(20000).optional(),
  ingredients: z.string().trim().max(5000).optional(),
  howToUse: z.string().trim().max(3000).optional(),
});

const productFields = {
  name: z.string().trim().min(2).max(150),
  translations: fromJsonString(z.object({ az: productText.optional(), ru: productText.optional() })).optional(),
  brand: z.string().trim().max(60).optional(),
  shortDescription: z.string().trim().max(600).optional(),
  description: z.string().trim().min(10),
  ingredients: z.string().trim().max(5000).optional(),
  howToUse: z.string().trim().max(3000).optional(),
  weight: z.string().trim().max(40).optional(),
  dimensions: z.string().trim().max(60).optional(),
  category: objectId,
  tags: stringList.optional(),
  skinTypes: fromJsonString(z.array(z.enum(SKIN_TYPES))).optional(),
  price: money,
  compareAtPrice: clearable(money).optional(),
  sku: z.string().trim().max(60).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  variants: fromJsonString(z.array(variant).max(50)).optional(),
  // Externally hosted high-res image URLs (in addition to uploaded files)
  imageUrls: fromJsonString(z.array(imageUrl).max(20)).optional(),
  isFeatured: boolish.optional(),
  isActive: boolish.optional(),
};

const compareAtPriceCheck = (v) =>
  v.compareAtPrice == null || v.price === undefined || v.compareAtPrice >= v.price;
const compareAtPriceError = {
  error: 'compareAtPrice must be greater than or equal to price',
  path: ['compareAtPrice'],
};

const createProduct = z.object(productFields).refine(compareAtPriceCheck, compareAtPriceError);

const updateProduct = z
  .object({
    ...productFields,
    // ids of existing images to delete
    removeImageIds: fromJsonString(z.array(objectId)).optional(),
  })
  .partial()
  .refine(compareAtPriceCheck, compareAtPriceError);

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  rating: { rating: -1, numReviews: -1 },
  best_selling: { sold: -1 },
};

const listProducts = z
  .object({
    ...pagination,
    sort: z.enum(Object.keys(SORTS)).default('newest'),
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(80).optional(), // id or slug
    brand: z.string().trim().max(60).optional(),
    tags: stringList.optional(),
    skinType: z.enum(SKIN_TYPES).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: boolish.optional(),
    featured: boolish.optional(),
    onSale: boolish.optional(),
    includeInactive: boolish.optional(), // honoured for admins only
    active: boolish.optional(), // admins: filter by active/inactive
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    error: 'minPrice cannot exceed maxPrice',
    path: ['minPrice'],
  });

const imageParams = z.object({ id: objectId, imageId: objectId });

module.exports = { createProduct, updateProduct, listProducts, imageParams, SORTS };
