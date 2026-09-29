const mongoose = require('mongoose');
const slugify = require('slugify');
const crypto = require('crypto');

const SKIN_TYPES = ['all', 'dry', 'oily', 'combination', 'normal', 'sensitive'];

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  alt: String,
});

// A purchasable option of a product, e.g. a lipstick shade or a 50ml bottle.
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  shade: String,
  colorHex: String,
  size: String,
  price: { type: Number, min: 0 }, // falls back to the product price when omitted
  stock: { type: Number, min: 0, default: 0 },
  image: String,
});

// Azerbaijani / Russian overrides of the English text fields; anything left empty falls back to English.
const productTextSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150 },
    shortDescription: { type: String, maxlength: 600 },
    description: String,
    ingredients: String,
    howToUse: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    translations: {
      az: { type: productTextSchema, default: undefined },
      ru: { type: productTextSchema, default: undefined },
    },
    slug: { type: String, unique: true, index: true },
    brand: { type: String, trim: true, default: 'Cosmecos' },
    shortDescription: { type: String, maxlength: 600 },
    description: { type: String, required: true },
    ingredients: String,
    howToUse: String,
    // Shown in the product page's additional information table
    weight: String,
    dimensions: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: { type: [String], index: true },
    skinTypes: [{ type: String, enum: SKIN_TYPES }],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // original price, for sale badges
    sku: { type: String, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [imageSchema],
    variants: [variantSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sold: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

productSchema.virtual('inStock').get(function inStock() {
  if (this.variants?.length) return this.variants.some((v) => v.stock > 0);
  return this.stock > 0;
});

productSchema.virtual('onSale').get(function onSale() {
  return Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.pre('validate', function setSlug() {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name || '', { lower: true, strict: true });
    // Suffix keeps slugs unique when two products share a name.
    this.slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
});

// For products with variants, total stock mirrors the sum of variant stock.
productSchema.pre('save', function syncStock() {
  if (this.variants?.length) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
});

module.exports = mongoose.model('Product', productSchema);
module.exports.SKIN_TYPES = SKIN_TYPES;
