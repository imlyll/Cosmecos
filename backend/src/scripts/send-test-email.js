/* Sends a sample verification email using the SMTP settings in .env, to check real delivery (e.g. Gmail).
 * Usage: npm run mail:check -- you@example.com [az|en|ru]
 */
require('dotenv').config({ quiet: true });
// The database isn't used here; these only satisfy env.js's required-variable check.
process.env.MONGO_URI = process.env.MONGO_URI || 'unused';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unused';
const { mail } = require('../config/env');
const { sendMail, verifyMailer, describeMailError, smtpEnabled, brevoEnabled } = require('../utils/mailer');
const { verificationEmail } = require('../utils/emailTemplates');

async function main() {
  const [to, lang = 'en'] = process.argv.slice(2);
  if (!to) throw new Error('Usage: npm run mail:check -- you@example.com [az|en|ru]');
  if (!smtpEnabled && !brevoEnabled) {
    throw new Error('Mail is not configured. Set BREVO_API_KEY, or SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in backend/.env');
  }
  if (!(await verifyMailer())) process.exit(1);
  const message = verificationEmail({ name: 'Cosmecos tester', code: '123456', minutes: 10, lang });
  const info = await sendMail({ to, ...message });
  console.log(`Sent "${message.subject}" from ${mail.from} to ${to} (${info.messageId}).`);
}

main().catch((err) => {
  console.error(`Could not send: ${err.code ? describeMailError(err) : err.message}`);
  process.exit(1);
});
