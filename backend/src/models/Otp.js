const mongoose = require('mongoose');

const PURPOSES = ['register', 'reset_password'];

/**
 * A one-time code emailed to a user. Only a hash of the code is stored.
 * There is at most one live code per email and purpose; issuing a new one replaces it.
 */
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: PURPOSES, default: 'register' },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB removes documents once expiresAt has passed (the TTL monitor runs about once a minute,
// so expiry is also checked explicitly when verifying).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
module.exports.PURPOSES = PURPOSES;
