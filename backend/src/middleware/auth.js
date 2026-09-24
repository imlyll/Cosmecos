const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

async function resolveUser(token) {
  const payload = verifyToken(token); // throws JsonWebTokenError / TokenExpiredError
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists or is disabled');
  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently, please log in again');
  }
  return user;
}

/** Requires a valid JWT and attaches the user document to req.user. */
async function protect(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication token missing');
  req.user = await resolveUser(token);
  next();
}

/** Attaches req.user when a valid token is sent, but never rejects the request. */
async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      // Invalid token on a public route: continue as a guest.
    }
  }
  next();
}

/** Restricts a route to the given roles. Must run after `protect`. */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };

const isAdmin = authorize('admin');

module.exports = { protect, optionalAuth, authorize, isAdmin };
