const crypto = require('crypto');
const Otp = require('../models/Otp');
const ApiError = require('../utils/ApiError');
const { sendMail, describeMailError } = require('../utils/mailer');
const { verificationEmail } = require('../utils/emailTemplates');
const { jwtSecret, isProd, otp: config } = require('../config/env');

const hashCode = (email, code) => crypto.createHmac('sha256', jwtSecret).update(`${email}:${code}`).digest('hex');

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/** Seconds until another code may be sent for this email (0 when allowed now). */
function cooldownRemaining(record) {
  if (!record) return 0;
  const elapsed = (Date.now() - record.lastSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(config.resendCooldownSeconds - elapsed));
}

async function resendAvailableIn(email, purpose = 'register') {
  return cooldownRemaining(await Otp.findOne({ email, purpose }));
}

/**
 * Generates a fresh code for the user, replacing any previous one, and emails it.
 * Throws 429 OTP_COOLDOWN if a code was sent less than the cooldown ago (unless `force`).
 * Resolves to the number of seconds before the next resend is allowed.
 */
async function issueOtp(user, { purpose = 'register', lang, force = false } = {}) {
  const { email } = user;
  const wait = cooldownRemaining(await Otp.findOne({ email, purpose }));
  if (wait > 0 && !force) {
    throw ApiError.tooManyRequests(`Please wait ${wait}s before requesting a new code`, {
      code: 'OTP_COOLDOWN',
      meta: { resendAvailableIn: wait },
    });
  }

  const code = generateCode();
  const now = new Date();
  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      codeHash: hashCode(email, code),
      expiresAt: new Date(now.getTime() + config.ttlMinutes * 60 * 1000),
      attempts: 0,
      lastSentAt: now,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const message = verificationEmail({ name: user.name, code, minutes: config.ttlMinutes, lang });
  try {
    await sendMail({ to: email, ...message, preview: { code } });
  } catch (err) {
    const reason = describeMailError(err);
    console.error(`[mail] Could not send the verification email to ${email}: ${reason}`);
    if (isProd) {
      // Let the user retry straight away instead of waiting out a cooldown for an email that never arrived.
      await Otp.deleteOne({ email, purpose });
    } else {
      // Development fallback: keep the code and print it, so sign-up can be finished while SMTP is being fixed
      // (signing in with the new account opens the code screen).
      console.warn(`[mail] DEV fallback: verification code for ${email} is ${code}`);
    }
    throw ApiError.badGateway('We could not send the verification email. Please try again shortly.', {
      code: 'EMAIL_SEND_FAILED',
      ...(!isProd && { meta: { reason } }),
    });
  }
  return config.resendCooldownSeconds;
}

/** Checks a submitted code; consumes it on success. Wrong guesses count towards a per-code limit. */
async function verifyOtp(email, code, purpose = 'register') {
  const record = await Otp.findOne({ email, purpose });
  if (!record || record.expiresAt <= new Date()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.', undefined, { code: 'OTP_EXPIRED' });
  }
  if (record.attempts >= config.maxAttempts) {
    throw ApiError.tooManyRequests('Too many incorrect attempts. Please request a new code.', {
      code: 'OTP_TOO_MANY_ATTEMPTS',
    });
  }

  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(hashCode(email, code), 'hex');
  if (!crypto.timingSafeEqual(expected, actual)) {
    record.attempts += 1;
    await record.save();
    const attemptsLeft = Math.max(0, config.maxAttempts - record.attempts);
    throw ApiError.badRequest('Incorrect verification code', [{ field: 'code', message: 'Incorrect verification code' }], {
      code: 'OTP_INVALID',
      meta: { attemptsLeft },
    });
  }

  await record.deleteOne();
}

module.exports = { issueOtp, verifyOtp, resendAvailableIn };
