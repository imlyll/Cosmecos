/* End-to-end smoke test against an in-memory MongoDB.
 * Usage: npm run smoke
 */
const assert = require('assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('cosmecos-test');
  process.env.JWT_SECRET = 'smoke-test-secret';
  process.env.NODE_ENV = 'test';
  process.env.CLOUDINARY_CLOUD_NAME = ''; // force local disk storage

  const mongoose = require('mongoose');
  const connectDB = require('../config/db');
  const app = require('../app');
  const User = require('../models/User');

  await connectDB(process.env.MONGO_URI);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const call = async (method, path, { token, body, form } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + path, { method, headers, body: form || (body && JSON.stringify(body)) });
    return { status: res.status, data: await res.json() };
  };
  const step = (name) => console.log(`  ✓ ${name}`);

  try {
    // --- Auth ---
    let r = await call('POST', '/auth/register', { body: { name: 'Leyla', email: 'Leyla@Test.com', password: 'short' } });
    assert.equal(r.status, 400);
    assert.ok(r.data.errors.some((e) => e.field === 'password'));
    step('register validation rejects weak password');

    r = await call('POST', '/auth/register', {
      body: { name: 'Leyla', email: 'Leyla@Test.com', password: 'Secret123', role: 'admin' },
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.user.role, 'user', 'role must not be settable on register');
    assert.equal(r.data.user.password, undefined);
    const userToken = r.data.token;
    step('register ignores role and hides password');

    r = await call('POST', '/auth/register', { body: { name: 'Dup', email: 'leyla@test.com', password: 'Secret123' } });
    assert.equal(r.status, 409);
    step('duplicate email rejected');

    r = await call('POST', '/auth/login', { body: { email: 'leyla@test.com', password: 'Wrong123' } });
    assert.equal(r.status, 401);
    r = await call('POST', '/auth/login', { body: { email: 'leyla@test.com', password: 'Secret123' } });
    assert.equal(r.status, 200);
    step('login');

    r = await call('GET', '/auth/me', { token: userToken });
    assert.equal(r.data.user.email, 'leyla@test.com');
    r = await call('GET', '/auth/me');
    assert.equal(r.status, 401);
    r = await call('GET', '/auth/me', { token: 'garbage' });
    assert.equal(r.status, 401);
    step('/auth/me requires a valid token');

    await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin1234', role: 'admin' });
    r = await call('POST', '/auth/login', { body: { email: 'admin@test.com', password: 'Admin1234' } });
    const adminToken = r.data.token;

    // --- Categories & products ---
    r = await call('POST', '/categories', { token: userToken, body: { name: 'Skincare' } });
    assert.equal(r.status, 403);
    step('non-admin blocked from admin routes');

    r = await call('POST', '/categories', { token: adminToken, body: { name: 'Skincare' } });
    assert.equal(r.status, 201);
    const skincare = r.data.category;
    assert.equal(skincare.slug, 'skincare');
    r = await call('POST', '/categories', { token: adminToken, body: { name: 'Lips' } });
    const lips = r.data.category;
    step('categories created');

    // Multipart create with an uploaded image and JSON-string fields
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const form = new FormData();
    form.append('name', 'Vitamin C Serum');
    form.append('description', 'Brightening serum with stabilised vitamin C.');
    form.append('category', skincare._id);
    form.append('price', '48');
    form.append('compareAtPrice', '60');
    form.append('stock', '5');
    form.append('tags', 'serum, vitamin c');
    form.append('isFeatured', 'true');
    form.append('images', new Blob([png], { type: 'image/png' }), 'serum.png');
    r = await call('POST', '/products', { token: adminToken, form });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const serum = r.data.product;
    assert.equal(serum.price, 48);
    assert.deepEqual(serum.tags, ['serum', 'vitamin c']);
    assert.equal(serum.onSale, true);
    assert.equal(serum.images.length, 1);
    const imgRes = await fetch(`http://127.0.0.1:${server.address().port}${serum.images[0].url}`);
    assert.equal(imgRes.status, 200);
    step('multipart product create with image upload');

    r = await call('POST', '/products', {
      token: adminToken,
      body: {
        name: 'Velvet Lipstick',
        description: 'Long-wear matte lipstick.',
        category: lips._id,
        price: 24,
        imageUrls: [{ url: 'https://images.example.com/lipstick-hires.jpg' }],
        variants: [
          { name: 'Rose', colorHex: '#C08081', stock: 3 },
          { name: 'Red', colorHex: '#B22222', stock: 10, price: 26 },
        ],
      },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const lipstick = r.data.product;
    assert.equal(lipstick.stock, 13, 'stock mirrors variant total');
    const [rose, red] = lipstick.variants;
    step('JSON product create with variants + image URLs');

    r = await call('POST', '/products', { token: adminToken, body: { name: 'X', price: -1 } });
    assert.equal(r.status, 400);
    step('product validation');

    // --- Listing ---
    r = await call('GET', '/products?sort=price_desc&limit=1');
    assert.equal(r.data.products[0].name, 'Vitamin C Serum');
    assert.equal(r.data.pagination.total, 2);
    assert.equal(r.data.pagination.hasNext, true);
    r = await call('GET', '/products?category=lips');
    assert.equal(r.data.products.length, 1);
    r = await call('GET', '/products?minPrice=30');
    assert.equal(r.data.products.length, 1);
    r = await call('GET', '/products?search=velvet');
    assert.equal(r.data.products[0].name, 'Velvet Lipstick');
    r = await call('GET', '/products?onSale=true');
    assert.equal(r.data.products.length, 1);
    r = await call('GET', '/products?minPrice=50&maxPrice=10');
    assert.equal(r.status, 400);
    r = await call('GET', `/products/${lipstick.slug}`);
    assert.equal(r.data.product._id, lipstick._id);
    r = await call('GET', '/products/filters');
    assert.equal(r.data.priceRange.max, 48);
    step('filtering, sorting, pagination, slug lookup, facets');

    // --- Cart ---
    r = await call('POST', '/cart/items', { token: userToken, body: { productId: lipstick._id, quantity: 1 } });
    assert.equal(r.status, 400, 'variant required');
    r = await call('POST', '/cart/items', {
      token: userToken,
      body: { productId: lipstick._id, variantId: rose._id, quantity: 5 },
    });
    assert.equal(r.status, 400, 'over stock');
    r = await call('POST', '/cart/items', {
      token: userToken,
      body: { productId: lipstick._id, variantId: red._id, quantity: 2 },
    });
    assert.equal(r.status, 201);
    r = await call('POST', '/cart/items', { token: userToken, body: { productId: serum._id, quantity: 1 } });
    r = await call('POST', '/cart/items', { token: userToken, body: { productId: serum._id, quantity: 1 } });
    assert.equal(r.data.cart.items.length, 2, 'same line merged');
    assert.equal(r.data.cart.itemCount, 4);
    assert.equal(r.data.cart.itemsPrice, 26 * 2 + 48 * 2);
    const serumLine = r.data.cart.items.find((i) => i.product._id === serum._id);
    r = await call('PATCH', `/cart/items/${serumLine._id}`, { token: userToken, body: { quantity: 1 } });
    assert.equal(r.data.cart.itemsPrice, 100);
    assert.equal(r.data.cart.shippingPrice, 0, 'free shipping at 100');
    step('cart add / merge / update / variant + stock checks / totals');

    // --- Wishlist ---
    r = await call('POST', '/wishlist/toggle', { token: userToken, body: { productId: serum._id } });
    assert.equal(r.data.added, true);
    assert.equal(r.data.count, 1);
    r = await call('POST', '/wishlist/toggle', { token: userToken, body: { productId: serum._id } });
    assert.equal(r.data.added, false);
    assert.equal(r.data.count, 0);
    step('wishlist toggle');

    // --- Coupons & contact ---
    r = await call('POST', '/admin/coupons', { token: adminToken, body: { code: 'TEN', type: 'percent', value: 10 } });
    assert.equal(r.status, 201);
    await call('POST', '/admin/coupons', { token: adminToken, body: { code: 'BIG', type: 'fixed', value: 5, minSubtotal: 500 } });
    r = await call('POST', '/coupons/validate', { token: userToken, body: { code: 'ten' } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.totals.discount, 10);
    assert.equal(r.data.totals.totalPrice, 90);
    r = await call('POST', '/coupons/validate', { token: userToken, body: { code: 'BIG' } });
    assert.equal(r.status, 400);
    r = await call('POST', '/coupons/validate', { token: userToken, body: { code: 'NOPE' } });
    assert.equal(r.status, 400);
    r = await call('POST', '/contact', { body: { name: 'Ann', email: 'ann@x.com', message: 'Hello, do you ship abroad?' } });
    assert.equal(r.status, 201);
    r = await call('GET', '/admin/messages', { token: adminToken });
    assert.equal(r.data.messages.length, 1);
    step('coupon validation + contact form');

    // --- Orders ---
    const address = {
      fullName: 'Leyla M',
      phone: '+994501234567',
      line1: '1 Nizami St',
      city: 'Baku',
      postalCode: 'AZ1000',
      country: 'Azerbaijan',
    };
    r = await call('POST', '/orders', { token: userToken, body: { shippingAddress: { city: 'x' } } });
    assert.equal(r.status, 400);
    r = await call('POST', '/orders', { token: userToken, body: { shippingAddress: address } });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const order = r.data.order;
    assert.equal(order.status, 'Pending');
    assert.equal(order.totalPrice, 100);
    assert.match(order.orderNumber, /^CSM-\d{8}-[0-9A-F]{6}$/);
    r = await call('GET', '/cart', { token: userToken });
    assert.equal(r.data.cart.items.length, 0, 'cart cleared after checkout');
    r = await call('GET', `/products/${lipstick._id}`);
    assert.equal(r.data.product.variants[1].stock, 8, 'variant stock decremented');
    assert.equal(r.data.product.stock, 11);
    step('checkout from cart decrements stock and clears cart');

    r = await call('POST', '/orders', {
      token: userToken,
      body: { shippingAddress: address, items: [{ productId: serum._id, quantity: 99 }] },
    });
    assert.equal(r.status, 409, 'insufficient stock');
    r = await call('POST', '/orders', {
      token: userToken,
      body: {
        shippingAddress: address,
        items: [
          { productId: lipstick._id, variantId: rose._id, quantity: 1 },
          { productId: serum._id, quantity: 50 },
        ],
      },
    });
    assert.equal(r.status, 409);
    r = await call('GET', `/products/${lipstick._id}`);
    assert.equal(r.data.product.variants[0].stock, 3, 'partial reservation rolled back');
    step('insufficient stock rejected and partial reservations rolled back');

    r = await call('GET', '/orders', { token: userToken });
    assert.equal(r.data.orders.length, 1);
    r = await call('GET', `/orders/${order._id}`, { token: adminToken });
    assert.equal(r.status, 200);
    step('order history + admin can view any order');

    // --- Admin ---
    r = await call('PATCH', `/admin/orders/${order._id}/status`, { token: adminToken, body: { status: 'Delivered' } });
    assert.equal(r.status, 400, 'illegal transition');
    r = await call('PATCH', `/admin/orders/${order._id}/status`, {
      token: adminToken,
      body: { status: 'Shipped', trackingNumber: 'TRK123' },
    });
    assert.equal(r.data.order.status, 'Shipped');
    assert.equal(r.data.order.trackingNumber, 'TRK123');
    r = await call('PATCH', `/orders/${order._id}/cancel`, { token: userToken });
    assert.equal(r.status, 400, 'cannot cancel shipped order');
    r = await call('PATCH', `/admin/orders/${order._id}/status`, { token: adminToken, body: { status: 'Delivered' } });
    assert.equal(r.data.order.isPaid, true, 'COD marked paid on delivery');
    assert.equal(r.data.order.statusHistory.length, 3);
    step('admin order status transitions');

    // Customer cancellation restocks
    r = await call('POST', '/orders', {
      token: userToken,
      body: { shippingAddress: address, items: [{ productId: serum._id, quantity: 2 }] },
    });
    const order2 = r.data.order;
    r = await call('PATCH', `/orders/${order2._id}/cancel`, { token: userToken });
    assert.equal(r.data.order.status, 'Cancelled');
    r = await call('GET', `/products/${serum._id}`);
    assert.equal(r.data.product.stock, 4, 'stock restored after cancel (5 - 1 delivered)');
    step('customer cancel restores stock');

    r = await call('GET', '/admin/users?search=leyla', { token: adminToken });
    assert.equal(r.data.users.length, 1);
    assert.equal(r.data.users[0].orderCount, 1);
    const userId = r.data.users[0]._id;
    r = await call('GET', '/admin/orders?status=Delivered', { token: adminToken });
    assert.equal(r.data.orders.length, 1);
    r = await call('GET', '/admin/stats', { token: adminToken });
    assert.equal(r.data.stats.revenue, 100);
    assert.equal(r.data.stats.ordersByStatus.Cancelled, 1);
    r = await call('GET', '/admin/users', { token: userToken });
    assert.equal(r.status, 403);
    step('admin users list, orders list, stats');

    r = await call('PATCH', `/admin/users/${userId}`, { token: adminToken, body: { isActive: false } });
    assert.equal(r.data.user.isActive, false);
    r = await call('GET', '/auth/me', { token: userToken });
    assert.equal(r.status, 401, 'disabled user token rejected');
    step('admin can disable a user');

    // --- Product update & delete ---
    r = await call('PUT', `/products/${serum._id}`, {
      token: adminToken,
      body: { price: 44, removeImageIds: [serum.images[0]._id] },
    });
    assert.equal(r.data.product.price, 44);
    assert.equal(r.data.product.images.length, 0);
    r = await call('DELETE', `/products/${serum._id}`, { token: adminToken });
    assert.equal(r.status, 200);
    r = await call('GET', `/products/${serum._id}`);
    assert.equal(r.status, 404);
    step('product update, image removal, delete');

    r = await call('GET', '/nope');
    assert.equal(r.status, 404);
    r = await call('GET', '/orders/not-an-id', { token: adminToken });
    assert.equal(r.status, 400);
    step('404 + invalid id handling');

    // --- Protected routes: every user endpoint rejects guests and bad tokens ---
    const fakeId = '64b7f0000000000000000000';
    const protectedRoutes = [
      ['GET', '/auth/me'],
      ['PATCH', '/auth/me'],
      ['PATCH', '/auth/me/password'],
      ['GET', '/cart'],
      ['DELETE', '/cart'],
      ['POST', '/cart/items'],
      ['PATCH', `/cart/items/${fakeId}`],
      ['DELETE', `/cart/items/${fakeId}`],
      ['GET', '/wishlist'],
      ['DELETE', '/wishlist'],
      ['POST', '/wishlist/toggle'],
      ['DELETE', `/wishlist/${fakeId}`],
      ['GET', '/orders'],
      ['POST', '/orders'],
      ['GET', `/orders/${fakeId}`],
      ['PATCH', `/orders/${fakeId}/cancel`],
      ['POST', '/coupons/validate'],
      ['GET', '/admin/stats'],
    ];
    const expired = require('jsonwebtoken').sign({ id: fakeId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: -10 });
    for (const [method, path] of protectedRoutes) {
      for (const token of [undefined, 'garbage', expired]) {
        r = await call(method, path, { token, body: method === 'GET' ? undefined : {} });
        assert.equal(r.status, 401, `${method} ${path} with token=${String(token).slice(0, 8)} → ${r.status}`);
        assert.equal(r.data.success, false);
      }
    }
    step(`${protectedRoutes.length} protected routes reject missing / invalid / expired tokens`);

    // --- Second customer: profile, password change, cart & wishlist removal, coupons at checkout ---
    r = await call('POST', '/auth/register', { body: { name: 'Aysel', email: 'aysel@test.com', password: 'Secret123' } });
    let aysel = r.data.token;
    r = await call('PATCH', '/auth/me', { token: aysel, body: { phone: '+994551112233', address: { city: 'Ganja' } } });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.phone, '+994551112233');
    assert.equal(r.data.user.address.city, 'Ganja');
    r = await call('PATCH', '/auth/me', { token: aysel, body: {} });
    assert.equal(r.status, 400, 'empty profile update rejected');
    step('profile update');

    r = await call('PATCH', '/auth/me/password', {
      token: aysel,
      body: { currentPassword: 'Wrong999', newPassword: 'Newpass123' },
    });
    // Must not be 401: the storefront treats 401 as "session expired" and signs the user out.
    assert.equal(r.status, 400, `wrong current password → ${r.status}`);
    assert.ok(r.data.errors?.some((e) => e.field === 'currentPassword'));
    r = await call('GET', '/auth/me', { token: aysel });
    assert.equal(r.status, 200, 'session survives a wrong current password');
    await new Promise((res) => setTimeout(res, 1100)); // JWT iat has 1s resolution
    r = await call('PATCH', '/auth/me/password', {
      token: aysel,
      body: { currentPassword: 'Secret123', newPassword: 'Newpass123' },
    });
    assert.equal(r.status, 200);
    const oldAysel = aysel;
    aysel = r.data.token;
    r = await call('GET', '/auth/me', { token: oldAysel });
    assert.equal(r.status, 401, 'old token rejected after password change');
    r = await call('GET', '/auth/me', { token: aysel });
    assert.equal(r.status, 200, 'new token works');
    r = await call('POST', '/auth/login', { body: { email: 'aysel@test.com', password: 'Newpass123' } });
    assert.equal(r.status, 200);
    step('password change: wrong current → 400, old token revoked, new token issued');

    r = await call('POST', '/cart/items', { token: aysel, body: { productId: lipstick._id, variantId: red._id, quantity: 1 } });
    r = await call('POST', '/cart/items', { token: aysel, body: { productId: lipstick._id, variantId: rose._id, quantity: 1 } });
    assert.equal(r.data.cart.items.length, 2);
    r = await call('DELETE', `/cart/items/${r.data.cart.items[0]._id}`, { token: aysel });
    assert.equal(r.data.cart.items.length, 1);
    r = await call('DELETE', `/cart/items/${fakeId}`, { token: aysel });
    assert.equal(r.status, 404);
    r = await call('DELETE', '/cart', { token: aysel });
    assert.equal(r.data.cart.items.length, 0);
    assert.equal(r.data.cart.totalPrice, 0);
    r = await call('POST', '/orders', { token: aysel, body: { shippingAddress: address } });
    assert.equal(r.status, 400, 'empty cart cannot be ordered');
    step('cart item removal, clear, empty-cart checkout rejected');

    r = await call('POST', '/wishlist/toggle', { token: aysel, body: { productId: lipstick._id } });
    r = await call('GET', '/wishlist', { token: aysel });
    assert.equal(r.data.count, 1);
    assert.equal(r.data.products[0].name, 'Velvet Lipstick');
    r = await call('DELETE', `/wishlist/${lipstick._id}`, { token: aysel });
    assert.equal(r.data.count, 0);
    await call('POST', '/wishlist/toggle', { token: aysel, body: { productId: lipstick._id } });
    r = await call('DELETE', '/wishlist', { token: aysel });
    assert.equal(r.data.count, 0);
    r = await call('POST', '/wishlist/toggle', { token: aysel, body: { productId: fakeId } });
    assert.equal(r.status, 404);
    step('wishlist get / remove / clear / unknown product');

    r = await call('POST', '/cart/items', { token: aysel, body: { productId: lipstick._id, variantId: red._id, quantity: 2 } });
    r = await call('POST', '/orders', {
      token: aysel,
      body: { shippingAddress: address, paymentMethod: 'card', couponCode: 'TEN' },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(r.data.order.couponCode, 'TEN');
    assert.equal(r.data.order.discount, 5.2);
    assert.equal(r.data.order.shippingPrice, 9.99);
    assert.equal(r.data.order.totalPrice, 52 - 5.2 + 9.99);
    assert.equal(r.data.order.paymentMethod, 'card');
    const ayselOrder = r.data.order;
    r = await call('GET', `/orders/${ayselOrder._id}`, { token: aysel });
    assert.equal(r.status, 200);
    step('order with coupon, card payment and shipping fee');

    r = await call('POST', '/auth/register', { body: { name: 'Other', email: 'other@test.com', password: 'Secret123' } });
    const other = r.data.token;
    r = await call('GET', `/orders/${ayselOrder._id}`, { token: other });
    assert.equal(r.status, 404, "customers can't read other customers' orders");
    r = await call('PATCH', `/orders/${ayselOrder._id}/cancel`, { token: other });
    assert.equal(r.status, 404, "customers can't cancel other customers' orders");
    r = await call('GET', '/orders', { token: other });
    assert.equal(r.data.orders.length, 0);
    step('order ownership enforced');

    console.log('\nAll smoke tests passed.');
  } finally {
    server.close();
    await mongoose.connection.close();
    await mongo.stop();
  }
}

main().catch((err) => {
  console.error('\nSmoke test failed:', err);
  process.exit(1);
});
