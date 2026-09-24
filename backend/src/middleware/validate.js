const ApiError = require('../utils/ApiError');

const formatIssues = (issues, location) =>
  issues.map((issue) => ({
    location,
    field: issue.path.join('.') || location,
    message: issue.message,
  }));

/**
 * Validates request parts against Zod schemas.
 *  - body is replaced with the parsed (coerced, stripped) value
 *  - query and params are exposed on req.validatedQuery / req.validatedParams,
 *    because Express 5 makes req.query read-only
 */
const validate =
  ({ body, query, params } = {}) =>
  (req, _res, next) => {
    const errors = [];
    const run = (schema, value, location, assign) => {
      if (!schema) return;
      const result = schema.safeParse(value ?? {});
      if (result.success) assign(result.data);
      else errors.push(...formatIssues(result.error.issues, location));
    };

    run(params, req.params, 'params', (data) => (req.validatedParams = data));
    run(query, req.query, 'query', (data) => (req.validatedQuery = data));
    run(body, req.body, 'body', (data) => (req.body = data));

    if (errors.length) throw ApiError.badRequest('Validation failed', errors);
    next();
  };

module.exports = validate;
