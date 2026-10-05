/* Starts the API on a random port against an in-memory MongoDB, for the Jest and Playwright tests.
 * Prints one line: `READY {json}` with the URL and fixture ids.
 * AUDIT_MODE=production runs it with NODE_ENV=production and makes Product.find throw,
 * so the tests can check what a 500 looks like in production.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create();
  const prod = process.env.AUDIT_MODE === 'production';
  const brevo = process.env.AUDIT_MODE === 'brevo';
  // Brevo mode sends mail through a fake Brevo API (below); the other modes keep mail in memory.
  process.env.BREVO_API_KEY = brevo ? 'test-brevo-key' : '';
  process.env.MAIL_FROM = 'Cosmecos <store@cosmecos.test>';
  process.env.MONGO_URI = mongo.getUri('audit');
  process.env.JWT_SECRET = 'audit-secret';
  process.env.NODE_ENV = prod ? 'production' : 'test';
  process.env.SMTP_HOST = '';
  process.env.SMTP_USER = '';
  process.env.CLOUDINARY_CLOUD_NAME = '';

  const express = require('express');
  const mongoose = require('mongoose');
  const api = require('../src/app');
  const { lastMailTo } = require('../src/utils/mailer');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Category = require('../src/models/Category');
  await mongoose.connect(process.env.MONGO_URI);

  await User.create({ name: 'Admin', email: 'admin@a.com', password: 'Admin1234', role: 'admin', isVerified: true });
  const category = await Category.create({ name: 'Skincare' });
  const serum = await Product.create({ name: 'Serum', description: 'Brightening serum.', category: category._id, price: 40, stock: 10 });

  if (prod) {
    Product.find = () => {
      throw new Error('secret internals');
    };
    Product.countDocuments = async () => {
      throw new Error('secret internals');
    };
  }

  // Fake Brevo API: recipients containing "reject" get a 400, "offline" a network error, "slow" never answer.
  const brevoCalls = [];
  if (brevo) {
    const realFetch = global.fetch;
    global.fetch = async (url, options = {}) => {
      if (!String(url).startsWith('https://api.brevo.com/')) return realFetch(url, options);
      const body = options.body ? JSON.parse(options.body) : null;
      brevoCalls.push({ url: String(url), method: options.method || 'GET', apiKey: options.headers['api-key'], body });
      const to = body?.to?.[0]?.email || '';
      const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
      if (to.includes('offline')) throw new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND api.brevo.com') });
      if (to.includes('slow')) {
        return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason)));
      }
      if (to.includes('reject')) return json(400, { code: 'invalid_parameter', message: 'Sender is not valid' });
      if (String(url).endsWith('/account')) return json(200, { email: 'owner@cosmecos.test' });
      return json(201, { messageId: '<fake@brevo>' });
    };
  }

  // Test-only routes so the tests can read what would otherwise need direct DB access.
  const app = express();
  app.get('/__audit__/brevo', (_req, res) => res.json(brevoCalls));
  app.get('/__audit__/otp/:email', (req, res) => {
    const mail = lastMailTo(req.params.email);
    res.json({ code: mail?.code || null, subject: mail?.subject || null });
  });
  app.get('/__audit__/user/:email', async (req, res) => {
    const u = await User.findOne({ email: req.params.email }).select('+password');
    res.json({ role: u?.role, hashPrefix: u?.password.slice(0, 7) });
  });
  app.get('/__audit__/stock/:id', async (req, res) => res.json({ stock: (await Product.findById(req.params.id)).stock }));
  app.use(api);

  // Prints the "Mail: ..." startup line, as server.js does.
  await require('../src/utils/mailer').verifyMailer();

  const server = app.listen(0, '127.0.0.1', () => {
    const info = {
      url: `http://127.0.0.1:${server.address().port}`,
      categoryId: String(category._id),
      serumId: String(serum._id),
      serumSlug: serum.slug,
    };
    console.log(`READY ${JSON.stringify(info)}`);
  });

  // Exit with the parent test runner.
  process.stdin.on('end', async () => {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  });
  process.stdin.resume();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
