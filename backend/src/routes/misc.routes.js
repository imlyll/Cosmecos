const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/misc.controller');
const v = require('../validators/misc.validator');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages, please try again later' },
});

router.post('/coupons/validate', protect, validate({ body: v.validateCoupon }), ctrl.validateCoupon);
router.post('/contact', contactLimiter, optionalAuth, validate({ body: v.contact }), ctrl.sendContactMessage);

module.exports = router;
