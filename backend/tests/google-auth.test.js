// "Sign in with Google": POST /api/auth/google with an ID token (signed by the fake Google in tests/server.js).
const request = require('supertest');

const T = JSON.parse(process.env.AUDIT_TEST);
const app = T.url;

const googleToken = async (options = {}) => (await request(app).post('/__audit__/google-token').send(options)).body.token;
const googleLogin = async (options) => request(app).post('/api/auth/google').send({ credential: await googleToken(options) });
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

let n = 0;
// A fresh Google identity per test.
const identity = (extra = {}) => {
  n += 1;
  return { claims: { sub: `g-${Date.now()}-${n}`, email: `google${n}-${Date.now()}@gmail.com`, ...extra } };
};

test('first Google sign-in creates a verified account and signs in', async () => {
  const id = identity({ name: 'Leyla Mustafa' });
  const res = await googleLogin(id);
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user).toMatchObject({ email: id.claims.email, name: 'Leyla Mustafa', isVerified: true, role: 'user' });

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
  expect(me.status).toBe(200);
});

test('signing in again uses the same account', async () => {
  const id = identity();
  const first = await googleLogin(id);
  const second = await googleLogin(id);
  expect(second.status).toBe(200);
  expect(second.body.user._id).toBe(first.body.user._id);
});

test('an existing account with the same email is linked, not duplicated, and keeps its password', async () => {
  const email = `linked${Date.now()}@gmail.com`;
  await request(app).post('/api/auth/register').send({ name: 'Leyla', email, password: 'Passw0rd1' });
  const { code } = (await request(app).get(`/__audit__/otp/${email}`)).body;
  const verified = await request(app).post('/api/auth/verify-otp').send({ email, code });

  const res = await googleLogin(identity({ email }));
  expect(res.status).toBe(200);
  expect(res.body.user._id).toBe(verified.body.user._id);
  // Both ways in keep working.
  expect((await login(email, 'Passw0rd1')).status).toBe(200);
});

test('linking an unverified account drops the unproven password', async () => {
  // Someone registered this email with their own password but never confirmed the code.
  const email = `squatted${Date.now()}@gmail.com`;
  await request(app).post('/api/auth/register').send({ name: 'Someone', email, password: 'Attack3rPass' });

  const res = await googleLogin(identity({ email }));
  expect(res.status).toBe(200);
  expect(res.body.user.isVerified).toBe(true);
  expect((await login(email, 'Attack3rPass')).status).toBe(401);
});

test('a Google-only account: password login is a plain 401, not a crash', async () => {
  const id = identity();
  await googleLogin(id);
  const res = await login(id.claims.email, 'Anything123');
  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Invalid email or password');
});

test('a Google-only account can set a password with "forgot password"', async () => {
  const id = identity();
  await googleLogin(id);
  const { email } = id.claims;
  await request(app).post('/api/auth/forgot-password').send({ email });
  let code;
  for (let i = 0; i < 50 && !code; i++) {
    const mail = (await request(app).get(`/__audit__/otp/${email}`)).body;
    if (mail.subject?.includes('password reset')) code = mail.code;
    else await new Promise((r) => setTimeout(r, 100));
  }
  expect((await request(app).post('/api/auth/reset-password').send({ email, code, password: 'NewPassw0rd' })).status).toBe(200);
  expect((await login(email, 'NewPassw0rd')).status).toBe(200);
  expect((await googleLogin(id)).status).toBe(200);
});

test('a Google-only account gets a clear 400 when changing a password it does not have', async () => {
  const res = await googleLogin(identity());
  const change = await request(app)
    .patch('/api/auth/me/password')
    .set('Authorization', `Bearer ${res.body.token}`)
    .send({ currentPassword: 'whatever', newPassword: 'NewPassw0rd' });
  expect(change.status).toBe(400);
  expect(change.body.message).toMatch(/no password yet/);
});

test.each([
  ['a token for another app (wrong audience)', { claims: { aud: 'someone-else.apps.googleusercontent.com' } }],
  ['a token from another issuer', { claims: { iss: 'https://evil.example.com' } }],
  ['an expired token', { expiresIn: -600 }],
  ['a token signed with a key Google does not publish', { untrustedKey: true }],
])('%s → 401', async (_name, options) => {
  const id = identity();
  const res = await googleLogin({ ...options, claims: { ...id.claims, ...options.claims } });
  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Google sign-in failed. Please try again.');
});

test('an unverified Google email → 401', async () => {
  const res = await googleLogin(identity({ email_verified: false }));
  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Your Google email address is not verified');
});

test('garbage or missing credential → 401 / 400', async () => {
  expect((await request(app).post('/api/auth/google').send({ credential: 'not-a-jwt' })).status).toBe(401);
  expect((await request(app).post('/api/auth/google').send({})).status).toBe(400);
});

test('a disabled account cannot sign in with Google', async () => {
  const id = identity();
  const user = (await googleLogin(id)).body.user;
  const admin = (await login('admin@a.com', 'Admin1234')).body.token;
  await request(app).patch(`/api/admin/users/${user._id}`).set('Authorization', `Bearer ${admin}`).send({ isActive: false });
  expect((await googleLogin(id)).status).toBe(403);
});
