const mongoose = require('mongoose');
const slugify = require('slugify');

// Azerbaijani / Russian overrides; empty fields fall back to English.
const categoryTextSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 60 },
    description: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    translations: {
      az: { type: categoryTextSchema, default: undefined },
      ru: { type: categoryTextSchema, default: undefined },
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, maxlength: 500 },
    image: { url: String, publicId: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function setSlug() {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
});

module.exports = mongoose.model('Category', categorySchema);
