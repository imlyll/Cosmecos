const { z } = require('zod');
const mongoose = require('mongoose');

const objectId = z
  .string()
  .trim()
  .refine((v) => mongoose.isValidObjectId(v), { error: 'Invalid id' });

const idParam = z.object({ id: objectId });
const idOrSlugParam = z.object({ idOrSlug: z.string().trim().min(1).max(200) });

// Multipart forms send everything as strings. These helpers accept either the
// native JSON type or its string form, so one schema serves JSON and form-data.
const fromJsonString = (schema) =>
  z.preprocess((v) => {
    if (typeof v !== 'string') return v;
    const trimmed = v.trim();
    if (!/^[[{]/.test(trimmed)) return v;
    try {
      return JSON.parse(trimmed);
    } catch {
      return v;
    }
  }, schema);

const boolish = z.preprocess((v) => {
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return v;
}, z.boolean());

// Comma-separated string or array -> string[]
const stringList = z.preprocess((v) => {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return v;
      }
    }
    return trimmed ? trimmed.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  return v;
}, z.array(z.string().trim().min(1)));

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
};

module.exports = { z, objectId, idParam, idOrSlugParam, fromJsonString, boolish, stringList, pagination };
