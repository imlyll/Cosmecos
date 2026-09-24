const { z, objectId } = require('./common');

const createCategory = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional(),
  parent: objectId.nullable().optional(),
});

const updateCategory = createCategory.partial();

module.exports = { createCategory, updateCategory };
