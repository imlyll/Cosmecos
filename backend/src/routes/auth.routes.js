const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authRateLimit } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Slow down brute-force attempts on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Through the error handler, so the message is translated like any other error.
  handler: (_req, _res, next) => next(ApiError.tooManyRequests('Too many attempts, please try again later')),
});

router.post('/register', authLimiter, validate({ body: v.register }), ctrl.register);
router.post('/login', authLimiter, validate({ body: v.login }), ctrl.login);
router.post('/verify-otp', authLimiter, validate({ body: v.verifyOtp }), ctrl.verifyOtp);
router.post('/resend-otp', authLimiter, validate({ body: v.resendOtp }), ctrl.resendOtp);
router.post('/forgot-password', authLimiter, validate({ body: v.forgotPassword }), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: v.resetPassword }), ctrl.resetPassword);

router.get('/me', protect, ctrl.me);
router.patch('/me', protect, validate({ body: v.updateProfile }), ctrl.updateMe);
router.patch('/me/password', protect, validate({ body: v.changePassword }), ctrl.changePassword);

module.exports = router;
