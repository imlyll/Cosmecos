const nodemailer = require('nodemailer');
const { mail, isProd } = require('./env');

/**
 * Nodemailer transport for transactional email (registration OTP codes).
 *
 * Gmail (backend/.env):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587                         # STARTTLS; use 465 + SMTP_SECURE=true for implicit TLS
 *   SMTP_USER=your_gmail@gmail.com
 *   SMTP_PASS=your_16_digit_app_password  # Google Account → Security → 2-Step Verification → App passwords
 *   MAIL_FROM="Cosmecos <you@example.com>"
 *
 * Without real credentials (empty or still the placeholders above) development and tests use a
 * JSON transport that renders the email but does not deliver it; production refuses to send.
 */

// Values copied from .env.example ("your_gmail@gmail.com", "your_16_digit_app_password") are not real credentials.
const isPlaceholder = (v) => !v || /your_|app_password|example\.com/i.test(v);

const smtpEnabled = Boolean(mail.host) && !isPlaceholder(mail.user) && !isPlaceholder(mail.pass);

function createTransport() {
  if (smtpEnabled) {
    return nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      // On 587, refuse to send credentials over an unencrypted connection.
      requireTLS: !mail.secure,
      auth: { user: mail.user, pass: mail.pass },
      tls: { rejectUnauthorized: mail.rejectUnauthorized },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  if (isProd) throw new Error('SMTP is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS');
  return nodemailer.createTransport({ jsonTransport: true });
}

let transport;
/** The shared transport, created on first use. */
const getTransport = () => (transport ??= createTransport());

const senderAddress = (from) => (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();

/**
 * Gmail only sends as the signed-in account or an alias verified under Gmail → Settings → Accounts →
 * "Send mail as". Any other MAIL_FROM address is replaced by SMTP_USER, so the recipient sees that.
 */
function fromAddressWarning() {
  if (!smtpEnabled || !/gmail\.com$/i.test(mail.host)) return null;
  const from = senderAddress(mail.from);
  if (from === mail.user.toLowerCase()) return null;
  return `MAIL_FROM uses ${from}, but Gmail sends as ${mail.user} unless ${from} is added as a verified "Send mail as" alias in Gmail settings.`;
}

module.exports = { getTransport, smtpEnabled, fromAddressWarning };
