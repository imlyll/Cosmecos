const { z } = require('./common');
const { LANGS } = require('../utils/emailTemplates');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const address = z.object({
  fullName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  line1: z.string().trim().max(120).optional(),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  state: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(60).optional(),
});

// Language for emails sent to the user.
const lang = z.enum(LANGS).optional();
const email = z.email().trim().toLowerCase();

const register = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  lang,
});

const login = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  lang,
});

const verifyOtp = z.object({
  email,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resendOtp = z.object({ email, lang });

const forgotPassword = z.object({ email, lang });

const resetPassword = z.object({
  email,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  password,
});

const updateProfile = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    address: address.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { error: 'Nothing to update' });

const changePassword = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    error: 'New password must differ from the current one',
    path: ['newPassword'],
  });

module.exports = { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword, updateProfile, changePassword };
