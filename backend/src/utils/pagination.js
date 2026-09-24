// Builds the standard pagination envelope returned by list endpoints.
const paginate = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

// Escapes user input before it is used inside a RegExp (prevents ReDoS / regex injection).
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { paginate, escapeRegex };
