const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');

const sendAuth = (res, status, user) =>
  res.status(status).json({ success: true, token: signToken(user), user });

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('Email is already registered');
  // Role is never taken from the request: new accounts are always customers.
  const user = await User.create({ name, email, password });
  sendAuth(res, 201, user);
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for both cases so the endpoint doesn't reveal which emails exist.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  sendAuth(res, 200, user);
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ success: true, user: req.user });
}

// PATCH /api/auth/me
async function updateMe(req, res) {
  const { name, phone, address } = req.body;
  const user = req.user;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = { ...(user.address?.toObject?.() || {}), ...address };
  await user.save();
  res.json({ success: true, user });
}

// PATCH /api/auth/me/password
async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  // 400, not 401: the session is valid, and clients treat 401 as "signed out".
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }
  user.password = req.body.newPassword;
  await user.save();
  // Old tokens are now invalid (passwordChangedAt), so hand back a fresh one.
  sendAuth(res, 200, user);
}

module.exports = { register, login, me, updateMe, changePassword };
