const multer = require('multer');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { translateMessage } = require('../utils/messages');
const { isProd } = require('../config/env');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Maps known library errors onto ApiError so clients get consistent responses.
function normalize(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}: ${JSON.stringify(err.value)}`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token expired, please log in again');
  if (err instanceof multer.MulterError) return ApiError.badRequest(`Upload error: ${err.message}`);
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');

  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const apiError = normalize(err);
  const status = apiError?.statusCode || 500;

  // Our own ApiErrors (e.g. 502 when email can't be sent) are already logged where they are raised.
  if (status >= 500 && !(err instanceof ApiError)) console.error(err);

  const lang = req.lang;
  res.status(status).json({
    success: false,
    message: translateMessage(apiError ? apiError.message : 'Internal server error', lang),
    ...(apiError?.code && { code: apiError.code }),
    ...apiError?.meta,
    ...(apiError?.details && {
      errors: apiError.details.map((d) => (d.message ? { ...d, message: translateMessage(d.message, lang) } : d)),
    }),
    ...(!isProd && status >= 500 && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
