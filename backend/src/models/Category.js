const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
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
