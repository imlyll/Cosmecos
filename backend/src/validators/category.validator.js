const { z, objectId, fromJsonString } = require('./common');

// Per-language overrides; empty strings mean "use the English text".
const categoryText = z.object({
  name: z.string().trim().max(60).optional(),
  description: z.string().trim().max(500).optional(),
});

const createCategory = z.object({
  name: z.string().trim().min(2).max(60),
  translations: fromJsonString(z.object({ az: categoryText.optional(), ru: categoryText.optional() })).optional(),
  description: z.string().trim().max(500).optional(),
  parent: objectId.nullable().optional(),
});

const updateCategory = createCategory.partial();

module.exports = { createCategory, updateCategory };
