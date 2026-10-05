// "Forgot password": POST /api/auth/forgot-password and /api/auth/reset-password.
const request = require('supertest');

const T = JSON.parse(process.env.AUDIT_TEST);
const B = JSON.parse(process.env.AUDIT_BREVO);
const app = T.url;

const forgot = (email, url = app) => request(url).post('/api/auth/forgot-password').send({ email });
const reset = (body) => request(app).post('/api/auth/reset-password').send(body);
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

// The code is emailed in the background, so wait for it to arrive.
async function resetCode(email) {
  for (let i = 0; i < 50; i++) {
    const mail = (await request(app).get(`/__audit__/otp/${email}`)).body;
    if (mail.subject?.includes('password reset')) return mail.code;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`No reset email for ${email}`);
}

// A verified account to work with.
async function createUser(email, password = 'Passw0rd1') {
  await request(app).post('/api/auth/register').send({ name: 'Leyla', email, password });
  const { code } = (await request(app).get(`/__audit__/otp/${email}`)).body;
  return (await request(app).post('/api/auth/verify-otp').send({ email, code })).body.token;
}

test('same answer for registered and unknown emails', async () => {
  await createUser('known@r.com');
  const known = await forgot('known@r.com');
  const unknown = await forgot('nobody@r.com');
  expect(known.status).toBe(200);
  expect(unknown.status).toBe(200);
  expect(unknown.body).toEqual(known.body);
  expect(known.body.message).toMatch(/If this email is registered/);
});

test('a second request during the cooldown still gets the same answer', async () => {
  await createUser('cool@r.com');
  const first = await forgot('cool@r.com');
  const second = await forgot('cool@r.com');
  expect(second.status).toBe(200);
  expect(second.body).toEqual(first.body);
});

test('invalid email → 400', async () => {
  expect((await forgot('not-an-email')).status).toBe(400);
});

test('reset with the emailed code: new password works, old password and old token do not', async () => {
  const oldToken = await createUser('reset@r.com', 'OldPassw0rd');
  // passwordChangedAt is set 1s in the past and token iat is in whole seconds, so only tokens issued
  // more than ~2s before the change are rejected.
  await new Promise((r) => setTimeout(r, 2100));
  await forgot('reset@r.com');
  const code = await resetCode('reset@r.com');

  const res = await reset({ email: 'reset@r.com', code, password: 'NewPassw0rd' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy(); // signed in straight away
  expect(res.body.user.password).toBeUndefined();

  expect((await login('reset@r.com', 'NewPassw0rd')).status).toBe(200);
  expect((await login('reset@r.com', 'OldPassw0rd')).status).toBe(401);
  expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${oldToken}`)).status).toBe(401);
  expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`)).status).toBe(200);
});

test('a code works only once', async () => {
  await createUser('once@r.com');
  await forgot('once@r.com');
  const code = await resetCode('once@r.com');
  expect((await reset({ email: 'once@r.com', code, password: 'Another1pass' })).status).toBe(200);
  const again = await reset({ email: 'once@r.com', code, password: 'Third1pass' });
  expect(again.status).toBe(400);
  expect(again.body.code).toBe('OTP_EXPIRED');
});

test('wrong code → 400 OTP_INVALID, and attempts are limited', async () => {
  await createUser('wrong@r.com');
  await forgot('wrong@r.com');
  const code = await resetCode('wrong@r.com');
  const bad = code === '000000' ? '111111' : '000000';
  const res = await reset({ email: 'wrong@r.com', code: bad, password: 'Passw0rd2' });
  expect(res.status).toBe(400);
  expect(res.body.code).toBe('OTP_INVALID');
  for (let i = 0; i < 4; i++) await reset({ email: 'wrong@r.com', code: bad, password: 'Passw0rd2' });
  // Locked out even with the right code now.
  expect((await reset({ email: 'wrong@r.com', code, password: 'Passw0rd2' })).body.code).toBe('OTP_TOO_MANY_ATTEMPTS');
});

test('unknown email → same error as an expired code', async () => {
  const res = await reset({ email: 'ghost@r.com', code: '123456', password: 'Passw0rd2' });
  expect(res.status).toBe(400);
  expect(res.body.code).toBe('OTP_EXPIRED');
});

test('a registration code cannot reset the password', async () => {
  await request(app).post('/api/auth/register').send({ name: 'Leyla', email: 'mix@r.com', password: 'Passw0rd1' });
  const { code } = (await request(app).get('/__audit__/otp/mix@r.com')).body;
  const res = await reset({ email: 'mix@r.com', code, password: 'Passw0rd2' });
  expect(res.status).toBe(400);
  expect(res.body.code).toBe('OTP_EXPIRED');
});

test('resetting verifies an account that was never verified', async () => {
  await request(app).post('/api/auth/register').send({ name: 'Leyla', email: 'unver@r.com', password: 'Passw0rd1' });
  await forgot('unver@r.com');
  const code = await resetCode('unver@r.com');
  expect((await reset({ email: 'unver@r.com', code, password: 'Passw0rd2' })).status).toBe(200);
  expect((await login('unver@r.com', 'Passw0rd2')).status).toBe(200);
});

test('weak new password → 400', async () => {
  const res = await reset({ email: 'known@r.com', code: '123456', password: 'short' });
  expect(res.status).toBe(400);
});

test('response does not wait for the email (no timing leak)', async () => {
  // Brevo mode: the fake API never answers for "slow" addresses. Registering creates the account
  // (and fails to email after the 15s timeout, which we don't wait for).
  // Not awaited: it only ends when the fake API times out (or the server stops after the tests).
  request(B.url)
    .post('/api/auth/register')
    .send({ name: 'Slow', email: 'slow-reset@r.com', password: 'Passw0rd1' })
    .then(
      () => {},
      () => {}
    );
  await new Promise((r) => setTimeout(r, 500));

  const started = Date.now();
  const res = await forgot('slow-reset@r.com', B.url);
  const known = Date.now() - started;
  expect(res.status).toBe(200);
  expect(known).toBeLessThan(1000); // the email itself would take 15s

  const t2 = Date.now();
  await forgot('nobody-slow@r.com', B.url);
  expect(Date.now() - t2).toBeLessThan(1000);
});
