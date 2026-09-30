const { mail, isProd, nodeEnv } = require('../config/env');
const { getTransport, smtpEnabled, fromAddressWarning } = require('../config/nodemailer');

/**
 * Email delivery through the transport in config/nodemailer.js.
 *  - With SMTP credentials (SMTP_* or EMAIL_USER/EMAIL_PASS), mail is sent through that server (e.g. Gmail).
 *  - Without them, development/test render the message but don't deliver it: it is printed to the
 *    console and kept in `outbox` (tests read codes from there). Production refuses to send.
 */
const outbox = [];

/** Human-readable cause for common SMTP failures, for logs and development error responses. */
function describeMailError(err) {
  const where = `${mail.host}:${mail.port}`;
  switch (err?.code) {
    case 'EAUTH':
      return /gmail/i.test(mail.host)
        ? 'Gmail rejected the login. Use a 16-character App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal Gmail password.'
        : `The SMTP server at ${where} rejected the username/password.`;
    case 'ECONNECTION':
    case 'ETIMEDOUT':
    case 'ESOCKET':
    case 'EDNS':
      return `Could not connect to the SMTP server at ${where} (${err.code}). Check SMTP_HOST/SMTP_PORT and your network.`;
    case 'ETLS':
      return `TLS negotiation with ${where} failed. Use port 587 with SMTP_SECURE=false, or 465 with SMTP_SECURE=true.`;
    case 'EENVELOPE':
      return 'The mail server refused the sender or recipient address.';
    default:
      return err?.message || 'Unknown mail error';
  }
}

async function sendMail({ to, subject, html, text, preview }) {
  const info = await getTransport().sendMail({ from: mail.from, to, subject, html, text });
  if (smtpEnabled) {
    if (nodeEnv !== 'test') console.log(`[mail] sent to ${to} (${info.messageId})`);
  } else {
    outbox.push({ to, subject, html, text, ...preview, sentAt: new Date() });
    if (outbox.length > 100) outbox.shift();
    if (nodeEnv !== 'test') console.log(`[mail] (not delivered: SMTP not configured) to=${to} subject="${subject}"`, preview || '');
  }
  return info;
}

/** Checks the SMTP login at startup so misconfiguration shows up in the logs straight away. */
async function verifyMailer() {
  if (!smtpEnabled) {
    const note = mail.host ? `SMTP_HOST is ${mail.host} but SMTP_USER/SMTP_PASS are missing` : 'SMTP is not configured';
    console.warn(`[mail] ${note}. ${isProd ? 'Emails cannot be sent.' : 'Verification emails will be printed here instead.'}`);
    return false;
  }
  try {
    await getTransport().verify();
    console.log(`[mail] SMTP ready: ${mail.user} via ${mail.host}:${mail.port}`);
    const warning = fromAddressWarning();
    if (warning) console.warn(`[mail] ${warning}`);
    return true;
  } catch (err) {
    console.error(`[mail] SMTP check failed: ${describeMailError(err)}`);
    return false;
  }
}

/** Latest captured message for an address (console transport only). */
const lastMailTo = (to) => [...outbox].reverse().find((m) => m.to === to.toLowerCase());

module.exports = { sendMail, verifyMailer, describeMailError, smtpEnabled, outbox, lastMailTo };
