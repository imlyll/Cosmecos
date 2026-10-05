const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { issueOtp, verifyOtp: checkOtp, resendAvailableIn } = require('../services/otp.service');
const { OAuth2Client } = require('google-auth-library');
const { otp: otpConfig, googleClientId } = require('../config/env');

const googleClient = new OAuth2Client();

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
  if (!user.password) {
    throw ApiError.badRequest('This account has no password yet. Use "Forgot password" to set one.');
  }
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

/** Emails a password reset code if the account exists and no code went out moments ago. */
async function sendResetCode(email, lang) {
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return;
  if ((await resendAvailableIn(email, 'reset_password')) > 0) return;
  await issueOtp(user, { purpose: 'reset_password', lang });
}

// POST /api/auth/forgot-password
// Always the same answer, sent straight away: neither the response nor its timing reveals whether
// the email is registered. The lookup and the email run in the background.
async function forgotPassword(req, res) {
  const { email, lang } = req.body;
  sendResetCode(email, lang).catch((err) => {
    // Failed sends are already logged by the OTP service; a cooldown just means two requests raced.
    if (!['EMAIL_SEND_FAILED', 'OTP_COOLDOWN'].includes(err.code)) {
      console.error(`[auth] Password reset for ${email} failed:`, err);
    }
  });
  res.json({
    success: true,
    message: 'If this email is registered, we sent a code to reset your password',
    expiresInMinutes: otpConfig.ttlMinutes,
    resendAvailableIn: otpConfig.resendCooldownSeconds,
  });
}

// POST /api/auth/reset-password
// The emailed code proves the email belongs to the user: set the new password and sign them in.
async function resetPassword(req, res) {
  const { email, code, password } = req.body;
  const user = await User.findOne({ email });
  // Same error as a wrong or expired code, so unknown emails can't be told apart.
  if (!user) {
    throw ApiError.badRequest('This code has expired. Please request a new one.', undefined, { code: 'OTP_EXPIRED' });
  }
  await checkOtp(email, code, 'reset_password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  user.password = password;
  user.isVerified = true;
  await user.save();
  // Older tokens stop working (passwordChangedAt); this one is fresh.
  sendAuth(res, 200, user);
}

// POST /api/auth/google
// Signs in with a Google ID token from Google Identity Services. Google has verified the email,
// so no code is needed. An existing account with the same email is linked rather than duplicated.
async function googleLogin(req, res) {
  if (!googleClientId) throw new ApiError(503, 'Google sign-in is not available');

  let payload;
  try {
    // Checks the signature against Google's keys, the audience (our client id), issuer and expiry.
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    // Library messages can include the whole token; keep just the reason.
    console.warn(`[auth] Google token rejected: ${err.message.split(':')[0]}`);
    throw ApiError.unauthorized('Google sign-in failed. Please try again.');
  }
  if (!payload.email || !payload.email_verified) {
    throw ApiError.unauthorized('Your Google email address is not verified');
  }

  const email = payload.email.toLowerCase();
  let user = (await User.findOne({ googleId: payload.sub })) || (await User.findOne({ email }));
  if (!user) {
    user = await User.create({
      name: (payload.name || email.split('@')[0]).slice(0, 80),
      email,
      googleId: payload.sub,
      isVerified: true,
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    if (!user.isVerified) {
      // Nobody proved they own this email when the password was set (it may not even be the owner's),
      // so it is dropped. The owner can set one with "forgot password".
      user.password = undefined;
      user.isVerified = true;
    }
    await user.save();
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  sendAuth(res, 200, user);
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
};
