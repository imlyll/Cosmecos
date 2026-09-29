const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { issueOtp, verifyOtp: checkOtp, resendAvailableIn } = require('../services/otp.service');
const { otp: otpConfig } = require('../config/env');

const sendAuth = (res, status, user) =>
  res.status(status).json({ success: true, token: signToken(user), user });

/** Emails a new code unless one went out moments ago; resolves to seconds until a resend is allowed. */
async function sendCodeUnlessRecent(user, lang) {
  const wait = await resendAvailableIn(user.email);
  return wait > 0 ? wait : issueOtp(user, { lang });
}

// POST /api/auth/register
// Creates an unverified account and emails a 6-digit code. No token until /verify-otp succeeds.
async function register(req, res) {
  const { name, email, password, lang } = req.body;
  let user = await User.findOne({ email });
  if (user?.isVerified) throw ApiError.conflict('Email is already registered');

  if (user) {
    // Registering again before verifying (e.g. lost the email): update the details and resend.
    user.name = name;
    user.password = password;
  } else {
    // Role is never taken from the request: new accounts are always customers.
    user = new User({ name, email, password, isVerified: false });
  }
  await user.save();

  const wait = await sendCodeUnlessRecent(user, lang);
  res.status(201).json({
    success: true,
    requiresVerification: true,
    email,
    message: 'We sent a verification code to your email',
    expiresInMinutes: otpConfig.ttlMinutes,
    resendAvailableIn: wait,
  });
}

// POST /api/auth/verify-otp
async function verifyOtp(req, res) {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (user?.isVerified) {
    throw ApiError.conflict('This email is already verified. Please sign in.', { code: 'ALREADY_VERIFIED' });
  }
  if (!user) {
    throw ApiError.badRequest('This code has expired. Please request a new one.', undefined, { code: 'OTP_EXPIRED' });
  }
  await checkOtp(email, code);
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  user.isVerified = true;
  await user.save();
  sendAuth(res, 200, user);
}

// POST /api/auth/resend-otp
async function resendOtp(req, res) {
  const { email, lang } = req.body;
  const user = await User.findOne({ email });
  // Same answer whether or not the email is pending, so this can't be used to probe for accounts.
  const wait = user && !user.isVerified ? await issueOtp(user, { lang }) : otpConfig.resendCooldownSeconds;
  res.json({
    success: true,
    message: 'If this email is awaiting verification, a new code has been sent',
    expiresInMinutes: otpConfig.ttlMinutes,
    resendAvailableIn: wait,
  });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password, lang } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for both cases so the endpoint doesn't reveal which emails exist.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  if (!user.isVerified) {
    // Correct password but never verified: send a code so the client can go straight to the code screen.
    const wait = await sendCodeUnlessRecent(user, lang);
    throw ApiError.forbidden('Please verify your email address to continue', {
      code: 'EMAIL_NOT_VERIFIED',
      meta: { email: user.email, resendAvailableIn: wait },
    });
  }
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

module.exports = { register, verifyOtp, resendOtp, login, me, updateMe, changePassword };
