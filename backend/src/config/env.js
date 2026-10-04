require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const num = (value, fallback) => (value === undefined || value === '' ? fallback : Number(value));

/**
 * SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS, or the Gmail shorthand EMAIL_USER / EMAIL_PASS
 * (which implies smtp.gmail.com). Port 465 uses implicit TLS; 587 upgrades with STARTTLS.
 */
function smtpConfig() {
  const e = process.env;
  const user = (e.SMTP_USER || e.EMAIL_USER || '').trim();
  const host = (e.SMTP_HOST || (e.EMAIL_USER ? 'smtp.gmail.com' : '')).trim();
  const port = num(e.SMTP_PORT, 587);
  let pass = e.SMTP_PASS || e.EMAIL_PASS || '';
  // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces are not part of the password.
  if (/gmail\.com$/i.test(host)) pass = pass.replace(/\s+/g, '');
  return {
    host,
    port,
    secure: e.SMTP_SECURE ? e.SMTP_SECURE === 'true' : port === 465,
    user,
    pass,
    from: e.MAIL_FROM || (user ? `Cosmecos <${user}>` : 'Cosmecos <no-reply@cosmecos.com>'),
    // Only for local/self-signed relays; leave unset for Gmail and other public providers.
    rejectUnauthorized: e.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    // When set, email goes through Brevo's HTTP API instead of SMTP (for hosts that block SMTP ports, e.g. Render).
    brevoApiKey: (e.BREVO_API_KEY || '').trim(),
  };
}

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
  // SMTP settings for transactional email (see utils/mailer.js). Without working credentials,
  // development prints emails to the console instead of sending them.
  mail: smtpConfig(),
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
