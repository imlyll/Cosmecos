class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array} [details] field-level errors, sent as `errors`
   * @param {object} [options] `code`: stable machine-readable error code; `meta`: extra fields merged into the body
   */
  constructor(statusCode, message, details, { code, meta } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.meta = meta;
  }

  static badRequest(message = 'Bad request', details, options) {
    return new ApiError(400, message, details, options);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not authorized to access this resource', options) {
    return new ApiError(403, message, undefined, options);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict', options) {
    return new ApiError(409, message, undefined, options);
  }

  static tooManyRequests(message = 'Too many requests', options) {
    return new ApiError(429, message, undefined, options);
  }

  static badGateway(message = 'Upstream service failed', options) {
    return new ApiError(502, message, undefined, options);
  }
}

module.exports = ApiError;
