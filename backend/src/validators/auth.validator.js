const { z } = require('./common');

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

const register = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password,
});

const login = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
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

module.exports = { register, login, updateProfile, changePassword };
