const nodemailer = require('nodemailer');
const { mail, isProd, nodeEnv } = require('../config/env');

/**
 * Sends email through SMTP when SMTP_HOST is configured. Otherwise (development/test) messages are
 * rendered but not delivered: they are logged to the console and kept in `outbox` for tests.
 */
const outbox = [];
let transport;

function getTransport() {
  if (transport) return transport;
  if (mail.host) {
    transport = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      ...(mail.user && { auth: { user: mail.user, pass: mail.pass } }),
    });
  } else {
    if (isProd) throw new Error('SMTP_HOST must be configured to send email in production');
    transport = nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}

async function sendMail({ to, subject, html, text, preview }) {
  const info = await getTransport().sendMail({ from: mail.from, to, subject, html, text });
  if (!mail.host) {
    outbox.push({ to, subject, html, text, ...preview, sentAt: new Date() });
    if (outbox.length > 100) outbox.shift();
    if (nodeEnv !== 'test') console.log(`[mail] (not delivered, SMTP_HOST unset) to=${to} subject="${subject}"`, preview || '');
  }
  return info;
}

/** Latest captured message for an address (dev/test transport only). */
const lastMailTo = (to) => [...outbox].reverse().find((m) => m.to === to.toLowerCase());

module.exports = { sendMail, outbox, lastMailTo };
