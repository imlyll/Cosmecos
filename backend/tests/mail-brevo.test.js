// Email through the Brevo HTTP API (BREVO_API_KEY set). The API itself is faked in tests/server.js.
const request = require('supertest');

const B = JSON.parse(process.env.AUDIT_BREVO);
const T = JSON.parse(process.env.AUDIT_TEST);
const app = B.url;
const calls = async () => (await request(app).get('/__audit__/brevo')).body;
const register = (email) => request(app).post('/api/auth/register').send({ name: 'Leyla', email, password: 'Passw0rd1' });

test('startup log shows the active mail mode', () => {
  expect(B.log).toMatch(/Mail: Brevo API/);
  expect(B.log).toMatch(/Brevo ready: account owner@cosmecos\.test/);
  expect(T.log).toMatch(/Mail: SMTP/);
});

test('registration sends the OTP email through the Brevo API', async () => {
  const res = await register('brevo@a.com');
  expect(res.status).toBe(201);

  const call = (await calls()).find((c) => c.body?.to?.[0]?.email === 'brevo@a.com');
  expect(call.url).toBe('https://api.brevo.com/v3/smtp/email');
  expect(call.method).toBe('POST');
  expect(call.apiKey).toBe('test-brevo-key');
  expect(call.body.sender).toEqual({ name: 'Cosmecos', email: 'store@cosmecos.test' });
  expect(call.body.subject).toMatch(/\d{6}/);
  expect(call.body.htmlContent).toContain('<table');
  expect(call.body.textContent).toMatch(/\d{6}/);
});

test('emailed code verifies the account', async () => {
  await register('brevo2@a.com');
  const call = (await calls()).find((c) => c.body?.to?.[0]?.email === 'brevo2@a.com');
  const code = call.body.textContent.match(/\b(\d{6})\b/)[1];
  const res = await request(app).post('/api/auth/verify-otp').send({ email: 'brevo2@a.com', code });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
});

test('Brevo rejecting the email → 502 EMAIL_SEND_FAILED with a clear reason', async () => {
  const res = await register('reject@a.com');
  expect(res.status).toBe(502);
  expect(res.body.code).toBe('EMAIL_SEND_FAILED');
  expect(res.body.reason).toMatch(/Brevo API error 400: Sender is not valid/);
});

test('Brevo unreachable → 502 instead of a crash', async () => {
  const res = await register('offline@a.com');
  expect(res.status).toBe(502);
  expect(res.body.reason).toMatch(/Could not reach the Brevo API: getaddrinfo ENOTFOUND/);
  expect((await request(app).get('/api/health')).status).toBe(200);
});

test('Brevo never answering → request times out with 502, server stays up', async () => {
  const started = Date.now();
  const res = await register('slow@a.com');
  expect(res.status).toBe(502);
  expect(res.body.reason).toMatch(/Could not reach the Brevo API/);
  expect(Date.now() - started).toBeLessThan(20_000);
  expect((await request(app).get('/api/health')).status).toBe(200);
}, 30_000);
