require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const num = (value, fallback) => (value === undefined || value === '' ? fallback : Number(value));

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Login/register attempts per IP per 15 minutes (strict in production, relaxed while developing).
  authRateLimit: num(process.env.AUTH_RATE_LIMIT, process.env.NODE_ENV === 'production' ? 20 : 200),
  // SMTP settings for transactional email. Without SMTP_HOST, emails are logged to the console (dev/test only).
  mail: {
    host: process.env.SMTP_HOST,
    port: num(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Cosmecos <no-reply@cosmecos.com>',
  },
  // Email verification codes sent on registration.
  otp: {
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 10),
    resendCooldownSeconds: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    maxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
  },
  pricing: {
    freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 100),
    shippingFee: num(process.env.SHIPPING_FEE, 9.99),
    taxRate: num(process.env.TAX_RATE, 0),
  },
};
