const { mail, isProd, nodeEnv } = require('../config/env');
const { getTransport, smtpEnabled, fromAddressWarning } = require('../config/nodemailer');

/**
 * Email delivery.
 *  - With BREVO_API_KEY, mail is sent through Brevo's HTTP API (works where SMTP ports are blocked).
 *  - With SMTP credentials (SMTP_* or EMAIL_USER/EMAIL_PASS), mail is sent through that server (e.g. Gmail).
 *  - Without them, development/test render the message but don't deliver it: it is printed to the
 *    console and kept in `outbox` (tests read codes from there). Production refuses to send.
 */
const outbox = [];

const BREVO_URL = 'https://api.brevo.com/v3';
const brevoEnabled = Boolean(mail.brevoApiKey);

/** Calls the Brevo API; failures throw an error whose message says what went wrong. */
async function brevoRequest(path, options = {}) {
  let res;
  try {
    res = await fetch(BREVO_URL + path, {
      ...options,
      headers: { 'api-key': mail.brevoApiKey, accept: 'application/json', 'content-type': 'application/json' },
      // Never let a slow API hold the request open.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw Object.assign(new Error(`Could not reach the Brevo API: ${err.cause?.message || err.message}`), { code: 'EBREVO' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint = res.status === 401 ? ' Check BREVO_API_KEY.' : '';
    throw Object.assign(new Error(`Brevo API error ${res.status}: ${data.message || res.statusText}.${hint}`), { code: 'EBREVO' });
  }
  return data;
}

// "Cosmecos <store@example.com>" → { name: 'Cosmecos', email: 'store@example.com' }
function parseFrom(from) {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return match ? { name: match[1] || undefined, email: match[2].trim() } : { email: from.trim() };
}

async function sendWithBrevo({ to, subject, html, text }) {
  const data = await brevoRequest('/smtp/email', {
    method: 'POST',
    body: JSON.stringify({ sender: parseFrom(mail.from), to: [{ email: to }], subject, htmlContent: html, textContent: text }),
  });
  return { messageId: data.messageId };
}

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
  if (brevoEnabled) {
    const info = await sendWithBrevo({ to, subject, html, text });
    if (nodeEnv !== 'test') console.log(`[mail] sent to ${to} via Brevo (${info.messageId})`);
    return info;
  }
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

/** Checks the mail setup at startup so misconfiguration shows up in the logs straight away. */
async function verifyMailer() {
  console.log(`[mail] Mail: ${brevoEnabled ? 'Brevo API' : 'SMTP'}`);
  if (brevoEnabled) {
    try {
      const account = await brevoRequest('/account');
      console.log(`[mail] Brevo ready: account ${account.email}, sending as ${mail.from}`);
      return true;
    } catch (err) {
      console.error(`[mail] Brevo check failed: ${err.message}`);
      return false;
    }
  }
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

module.exports = { sendMail, verifyMailer, describeMailError, smtpEnabled, brevoEnabled, outbox, lastMailTo };
