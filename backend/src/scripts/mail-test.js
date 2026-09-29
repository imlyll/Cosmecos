/* Verifies real SMTP delivery end to end: runs a local SMTP server (STARTTLS + login, like Gmail on 587),
 * registers a user through the API and checks the HTML verification email that actually arrives.
 * Usage: npm run test:mail
 */
const assert = require('assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

const SMTP_USER = 'store@cosmecos.test';
const SMTP_PASS = 'app-password-123';

async function main() {
  const inbox = [];
  let rejectLogins = false;
  const smtp = new SMTPServer({
    authMethods: ['PLAIN', 'LOGIN'],
    // smtp-server ships a self-signed certificate for STARTTLS.
    onAuth(auth, _session, cb) {
      if (rejectLogins || auth.username !== SMTP_USER || auth.password !== SMTP_PASS) {
        const err = new Error('Invalid login: 535 Username and Password not accepted');
        err.responseCode = 535;
        return cb(err);
      }
      cb(null, { user: auth.username });
    },
    onData(stream, _session, cb) {
      simpleParser(stream)
        .then((mail) => inbox.push(mail))
        .then(() => cb(), cb);
    },
  });
  await new Promise((resolve) => smtp.listen(0, '127.0.0.1', resolve));

  const mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    MONGO_URI: mongo.getUri('cosmecos-mail-test'),
    JWT_SECRET: 'mail-test-secret',
    NODE_ENV: 'test',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.server.address().port),
    SMTP_SECURE: 'false',
    SMTP_USER,
    SMTP_PASS,
    SMTP_TLS_REJECT_UNAUTHORIZED: 'false',
    MAIL_FROM: 'Cosmecos <store@cosmecos.test>',
  });

  const mongoose = require('mongoose');
  const app = require('../app');
  const { verifyMailer, smtpEnabled } = require('../utils/mailer');
  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = async (path, body) => {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };
  const step = (name) => console.log(`  ✓ ${name}`);

  try {
    assert.equal(smtpEnabled, true);
    assert.equal(await verifyMailer(), true);
    step('SMTP login verified at startup (STARTTLS + auth)');

    let r = await post('/auth/register', { name: 'Aylin', email: 'aylin@inbox.test', password: 'Secret123', lang: 'ru' });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(inbox.length, 1);
    const mail = inbox[0];
    assert.equal(mail.to.text, 'aylin@inbox.test');
    assert.deepEqual(mail.from.value, [{ name: 'Cosmecos', address: 'store@cosmecos.test' }]);
    const code = mail.text.match(/\b(\d{6})\b/)[1];
    assert.match(mail.subject, new RegExp(`^${code} — ваш код подтверждения Cosmecos$`));
    assert.ok(mail.html.includes('COSMECOS') && mail.html.includes('<table'), 'HTML body is sent');
    assert.ok(code.split('').every((d) => mail.html.includes(`>${d}</td>`)), 'each digit is rendered in the HTML');
    step('registration delivers an HTML email with the code, in the requested language');

    r = await post('/auth/verify-otp', { email: 'aylin@inbox.test', code });
    assert.equal(r.status, 200);
    assert.ok(r.data.token);
    step('the emailed code verifies the account');

    rejectLogins = true;
    r = await post('/auth/register', { name: 'Bora', email: 'bora@inbox.test', password: 'Secret123' });
    assert.equal(r.status, 502);
    assert.equal(r.data.code, 'EMAIL_SEND_FAILED');
    assert.match(r.data.reason, /rejected the username\/password/);
    step('an SMTP login failure returns 502 EMAIL_SEND_FAILED with the reason (outside production)');

    console.log('\nAll mail tests passed.');
  } finally {
    server.close();
    await mongoose.connection.close();
    await mongo.stop();
    smtp.close();
  }
}

main().catch((err) => {
  console.error('\nMail test failed:', err);
  process.exit(1);
});
