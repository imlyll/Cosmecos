// DELETE /api/auth/me: the customer deletes their own account.
const request = require('supertest');

const T = JSON.parse(process.env.AUDIT_TEST);
const app = T.url;
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const address = { fullName: 'Leyla Mustafa', phone: '+994501234567', line1: 'Nizami 1', city: 'Baku', postalCode: 'AZ1000', country: 'Azerbaijan' };

let adminToken;
let productId;

beforeAll(async () => {
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@a.com', password: 'Admin1234' })).body.token;
  // A product of its own, so these orders don't touch the stock other test files check.
  const product = await request(app)
    .post('/api/products')
    .set(auth(adminToken))
    .send({ name: 'Deletion Test Cream', description: 'Cream used by the deletion tests.', category: T.categoryId, price: 10, stock: 50 });
  productId = product.body.product._id;
});

let n = 0;
async function createUser(password = 'Passw0rd1') {
  n += 1;
  const email = `delete${n}-${Date.now()}@d.com`;
  await request(app).post('/api/auth/register').send({ name: 'Leyla', email, password });
  const { code } = (await request(app).get(`/__audit__/otp/${email}`)).body;
  const res = await request(app).post('/api/auth/verify-otp').send({ email, code });
  return { email, token: res.body.token, id: res.body.user._id };
}

async function googleUser() {
  n += 1;
  const claims = { sub: `del-${Date.now()}-${n}`, email: `gdel${n}-${Date.now()}@gmail.com` };
  const { token } = (await request(app).post('/__audit__/google-token').send({ claims })).body;
  const res = await request(app).post('/api/auth/google').send({ credential: token });
  return { email: claims.email, token: res.body.token, id: res.body.user._id };
}

const leftovers = async (u) => (await request(app).get(`/__audit__/leftovers/${u.id}/${u.email}`)).body;
const deleteMe = (token, body) => request(app).delete('/api/auth/me').set(auth(token)).send(body);

test('deletes the account, cart, wishlist and messages; keeps orders but anonymised', async () => {
  const u = await createUser();
  const h = auth(u.token);
  const kept = await request(app)
    .post('/api/orders')
    .set(h)
    .send({ items: [{ productId, quantity: 1 }], shippingAddress: address, notes: 'Ring the bell twice' });
  const cancelled = await request(app).post('/api/orders').set(h).send({ items: [{ productId, quantity: 1 }], shippingAddress: address });
  await request(app).patch(`/api/orders/${cancelled.body.order._id}/cancel`).set(h);
  await request(app).post('/api/cart/items').set(h).send({ productId, quantity: 2 });
  await request(app).post('/api/wishlist/toggle').set(h).send({ productId });
  await request(app).post('/api/contact').set(h).send({ name: 'Leyla', email: u.email, message: 'Hello, a question about my order.' });

  // Both orders name the customer in their status history (placed, and cancelled).
  const before = await leftovers(u);
  expect(before).toMatchObject({ users: 1, carts: 1, wishlists: 1, messages: 1, orders: 2, ordersMentioningUser: 2 });

  const res = await deleteMe(u.token, { password: 'Passw0rd1' });
  expect(res.status).toBe(200);
  expect(res.body.message).toBe('Your account has been deleted');

  expect(await leftovers(u)).toEqual({ users: 0, carts: 0, wishlists: 0, otps: 0, messages: 0, orders: 0, ordersMentioningUser: 0 });

  // The admin still sees the orders, without anything that identifies the customer.
  for (const id of [kept.body.order._id, cancelled.body.order._id]) {
    const order = (await request(app).get(`/api/orders/${id}`).set(auth(adminToken))).body.order;
    expect(order.user).toBeNull();
    expect(order.shippingAddress).toEqual({ fullName: 'Deleted user', phone: '-', line1: '-', city: '-', postalCode: '-', country: '-' });
    expect(order.notes).toBeUndefined();
    expect(order.totalPrice).toBeGreaterThan(0);
  }
  expect((await request(app).get('/api/admin/orders').set(auth(adminToken))).status).toBe(200);
  expect((await request(app).get('/api/admin/stats').set(auth(adminToken))).status).toBe(200);
});

test('afterwards the old session and password stop working, and the email can register again', async () => {
  const u = await createUser();
  await deleteMe(u.token, { password: 'Passw0rd1' });
  expect((await request(app).get('/api/auth/me').set(auth(u.token))).status).toBe(401);
  expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'Passw0rd1' })).status).toBe(401);
  expect((await request(app).post('/api/auth/register').send({ name: 'Again', email: u.email, password: 'Passw0rd2' })).status).toBe(201);
});

test('wrong or missing password → 400 and nothing is deleted', async () => {
  const u = await createUser();
  const wrong = await deleteMe(u.token, { password: 'WrongPass1' });
  expect(wrong.status).toBe(400);
  expect(wrong.body.errors[0].field).toBe('password');
  expect((await deleteMe(u.token, {})).status).toBe(400);
  // Typing the word is only for Google accounts.
  expect((await deleteMe(u.token, { confirm: 'DELETE' })).status).toBe(400);
  expect((await leftovers(u)).users).toBe(1);
  expect((await request(app).get('/api/auth/me').set(auth(u.token))).status).toBe(200);
});

test('a Google account is deleted with the confirmation word', async () => {
  const u = await googleUser();
  const wrong = await deleteMe(u.token, { confirm: 'delete it' });
  expect(wrong.status).toBe(400);
  expect(wrong.body.errors[0].field).toBe('confirm');
  expect((await deleteMe(u.token, { confirm: 'DELETE' })).status).toBe(200);
  expect((await leftovers(u)).users).toBe(0);
});

test('an admin account cannot be deleted this way', async () => {
  const res = await deleteMe(adminToken, { password: 'Admin1234' });
  expect(res.status).toBe(403);
  expect((await request(app).post('/api/auth/login').send({ email: 'admin@a.com', password: 'Admin1234' })).status).toBe(200);
});

test('without a session → 401', async () => {
  expect((await request(app).delete('/api/auth/me').send({ password: 'x' })).status).toBe(401);
});
