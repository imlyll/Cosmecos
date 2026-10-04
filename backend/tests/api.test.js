const request = require('supertest');
const T = JSON.parse(process.env.AUDIT_TEST);
const P = JSON.parse(process.env.AUDIT_PROD);
const app = T.url;
const serum = { _id: T.serumId, slug: T.serumSlug };
const category = { _id: T.categoryId };
let adminToken, userToken;
const Product = { stock: async () => (await request(app).get('/__audit__/stock/' + T.serumId)).body.stock };

beforeAll(async () => {
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@a.com', password: 'Admin1234' })).body.token;
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('Auth', () => {
  test('register → 201, role cannot be injected', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Leyla', email: 'u@a.com', password: 'Passw0rd1', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.requiresVerification).toBe(true);
    const u = (await request(app).get('/__audit__/user/u@a.com')).body;
    expect(u.role).toBe('user');
    expect(u.hashPrefix).toBe('$2b$12$'); // bcrypt, 12 rounds
  });

  test('login before verification → 403', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'u@a.com', password: 'Passw0rd1' });
    expect(res.status).toBe(403);
  });

  test('verify OTP → 200 with token', async () => {
    const { code } = (await request(app).get('/__audit__/otp/u@a.com')).body;
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'u@a.com', code });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.password).toBeUndefined();
  });

  test('login → 200', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'u@a.com', password: 'Passw0rd1' });
    expect(res.status).toBe(200);
    userToken = res.body.token;
  });

  test('wrong password → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'u@a.com', password: 'wrong999x' });
    expect(res.status).toBe(401);
  });

  test('invalid body → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('NoSQL injection in login → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('/me without token → 401, with bad token → 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth('garbage'))).status).toBe(401);
  });

  test('malformed JSON → 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});

describe('Products', () => {
  test('list → 200', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  test('NoSQL operator in query is rejected or ignored', async () => {
    const res = await request(app).get('/api/products?price[$gt]=0&brand[$ne]=x');
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) expect(res.body.products.length).toBeGreaterThanOrEqual(0);
  });

  test('details by id and slug → 200', async () => {
    expect((await request(app).get(`/api/products/${serum._id}`)).status).toBe(200);
    expect((await request(app).get(`/api/products/${serum.slug}`)).status).toBe(200);
  });

  test('unknown product → 404, unknown route → 404', async () => {
    expect((await request(app).get('/api/products/507f1f77bcf86cd799439011')).status).toBe(404);
    expect((await request(app).get('/api/does-not-exist')).status).toBe(404);
  });
});

describe('Admin protection', () => {
  const body = () => ({ name: 'Night Cream', description: 'Rich night cream.', category: String(category._id), price: 30, stock: 5 });

  test('no token → 401', async () => {
    expect((await request(app).post('/api/products').send(body())).status).toBe(401);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  test('customer token → 403 on every admin endpoint', async () => {
    const h = auth(userToken);
    const id = serum._id;
    const results = await Promise.all([
      request(app).get('/api/admin/stats').set(h),
      request(app).get('/api/admin/users').set(h),
      request(app).get('/api/admin/orders').set(h),
      request(app).post('/api/products').set(h).send(body()),
      request(app).put(`/api/products/${id}`).set(h).send({ price: 1 }),
      request(app).delete(`/api/products/${id}`).set(h),
      request(app).post('/api/categories').set(h).send({ name: 'X' }),
    ]);
    results.forEach((r) => expect(r.status).toBe(403));
  });

  test('admin create → edit → delete', async () => {
    const h = auth(adminToken);
    const created = await request(app).post('/api/products').set(h).send(body());
    expect(created.status).toBe(201);
    const id = created.body.product._id;

    const edited = await request(app).put(`/api/products/${id}`).set(h).send({ price: 35 });
    expect(edited.status).toBe(200);
    expect(edited.body.product.price).toBe(35);

    expect((await request(app).delete(`/api/products/${id}`).set(h)).status).toBe(200);
    expect((await request(app).get(`/api/products/${id}`)).status).toBe(404);
  });

  test('admin create with invalid data → 400', async () => {
    const res = await request(app).post('/api/products').set(auth(adminToken)).send({ name: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('Cart, order, wishlist', () => {
  let itemId;

  test('cart requires login → 401', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
  });

  test('add / update / remove cart item', async () => {
    const h = auth(userToken);
    const add = await request(app).post('/api/cart/items').set(h).send({ productId: String(serum._id), quantity: 2 });
    expect(add.status).toBeLessThan(300);
    itemId = add.body.cart.items[0]._id;
    const upd = await request(app).patch(`/api/cart/items/${itemId}`).set(h).send({ quantity: 3 });
    expect(upd.status).toBe(200);
    expect(upd.body.cart.items[0].quantity).toBe(3);
    const del = await request(app).delete(`/api/cart/items/${itemId}`).set(h);
    expect(del.status).toBe(200);
    expect(del.body.cart.items.length).toBe(0);
  });

  test('add unknown product → 404, quantity 0 → 400', async () => {
    const h = auth(userToken);
    expect((await request(app).post('/api/cart/items').set(h).send({ productId: '507f1f77bcf86cd799439011' })).status).toBe(404);
    expect((await request(app).post('/api/cart/items').set(h).send({ productId: String(serum._id), quantity: 0 })).status).toBe(400);
  });

  test('place order from cart → 201, stock decreases, cart emptied', async () => {
    const h = auth(userToken);
    await request(app).post('/api/cart/items').set(h).send({ productId: String(serum._id), quantity: 2 });
    const res = await request(app).post('/api/orders').set(h).send({
      shippingAddress: { fullName: 'Leyla M', phone: '+994501234567', line1: 'Nizami 1', city: 'Baku', postalCode: 'AZ1000', country: 'Azerbaijan' },
    });
    expect(res.status).toBe(201);
    expect(await Product.stock()).toBe(8);
    expect((await request(app).get('/api/cart').set(h)).body.cart.items.length).toBe(0);
    expect((await request(app).get('/api/orders').set(h)).body.orders.length).toBe(1);
  });

  test('order with empty cart → 400, missing address → 400', async () => {
    const h = auth(userToken);
    const empty = await request(app).post('/api/orders').set(h).send({
      shippingAddress: { fullName: 'Leyla M', phone: '+994501234567', line1: 'Nizami 1', city: 'Baku', postalCode: 'AZ1000', country: 'Azerbaijan' },
    });
    expect(empty.status).toBe(400);
    expect((await request(app).post('/api/orders').set(h).send({})).status).toBe(400);
  });

  test('order more than stock → 400/409', async () => {
    const h = auth(userToken);
    const res = await request(app).post('/api/orders').set(h).send({
      items: [{ productId: String(serum._id), quantity: 99 }],
      shippingAddress: { fullName: 'Leyla M', phone: '+994501234567', line1: 'Nizami 1', city: 'Baku', postalCode: 'AZ1000', country: 'Azerbaijan' },
    });
    expect([400, 409]).toContain(res.status);
  });

  test('wishlist toggle add / remove', async () => {
    const h = auth(userToken);
    const add = await request(app).post('/api/wishlist/toggle').set(h).send({ productId: String(serum._id) });
    expect(add.status).toBe(200);
    expect(add.body.count).toBe(1);
    const del = await request(app).delete(`/api/wishlist/${serum._id}`).set(h);
    expect(del.status).toBe(200);
    expect(del.body.count).toBe(0);
  });
});

describe('500 handling (production mode)', () => {
  test('unexpected error → 500, generic message, no stack', async () => {
    const res = await request(P.url).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/secret internals/);
  });
});
