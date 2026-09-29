/* Starts the API on a random port against an in-memory MongoDB with a little fixture data.
 * Used by the frontend integration tests. Prints one line: `READY {json}` with the URL and fixture ids.
 * Usage: node src/scripts/test-server.js
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('cosmecos-web-test');
  process.env.JWT_SECRET = 'web-test-secret';
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  process.env.CLOUDINARY_CLOUD_NAME = '';
  process.env.SMTP_HOST = ''; // capture emails in memory
  process.env.OTP_RESEND_COOLDOWN_SECONDS = '1';

  const express = require('express');
  const mongoose = require('mongoose');
  const api = require('../app');
  const { lastMailTo } = require('../utils/mailer');
  const User = require('../models/User');
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const Coupon = require('../models/Coupon');

  await mongoose.connect(process.env.MONGO_URI);

  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin1234', role: 'admin' });
  const category = await Category.create({ name: 'Skincare' });
  const serum = await Product.create({
    name: 'Vitamin C Serum',
    description: 'Brightening serum.',
    category: category._id,
    price: 40,
    stock: 10,
  });
  const lipstick = await Product.create({
    name: 'Velvet Lipstick',
    description: 'Matte lipstick.',
    category: category._id,
    price: 20,
    variants: [{ name: 'Rose', stock: 5 }],
  });
  await Coupon.create({ code: 'TEN', type: 'percent', value: 10 });

  // Test-only route so the tests can read the verification code that would have been emailed.
  const app = express();
  app.get('/__test__/otp/:email', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const mail = lastMailTo(req.params.email);
    res.json({ code: mail?.code || null, subject: mail?.subject || null });
  });
  app.use(api);

  const server = app.listen(0, '127.0.0.1', () => {
    const info = {
      url: `http://127.0.0.1:${server.address().port}`,
      serumId: String(serum._id),
      lipstickId: String(lipstick._id),
      roseId: String(lipstick.variants[0]._id),
    };
    console.log(`READY ${JSON.stringify(info)}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.connection.close();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  // Exit with the parent test runner.
  process.stdin.on('end', shutdown);
  process.stdin.resume();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
