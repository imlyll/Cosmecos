/* Seeds categories, coupons, an admin account and sample products.
 * Usage: npm run seed            (adds data if missing)
 *        npm run seed -- --fresh (wipes products/categories/coupons first)
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const {
  CATEGORY_TRANSLATIONS,
  COPY,
  productTranslations,
  LEGACY_SHORT_DESCRIPTION_START,
} = require('./seed-content');

// Product photos live in backend/uploads/demo and are served by the API at /uploads/demo/*.
const demoImage = (file) => `/uploads/demo/${file}`;

const CATEGORIES = [
  { name: 'Awesome Soap', description: 'Handmade soaps and cleansing bars.' },
  { name: 'Body Care', description: 'Lotions, oils and creams for the body.' },
  { name: 'Cosmetics', description: 'Makeup, fragrance and colour cosmetics.' },
  { name: 'Hair Care', description: 'Oils, masks and treatments for hair.' },
  { name: 'Makeup Equipment', description: 'Brushes, sponges and tools.' },
  { name: 'Perfect Concealer', description: 'Concealers and correctors.' },
];


// The demo store's catalogue, in publishing order (the last one is the newest).
const PRODUCTS = [
  { id: 2836, name: 'Body Oil & Lotion', category: 'Body Care', price: 15, compareAtPrice: 27, rating: 5, tags: ['cosmetic', 'skincare'], image: 'img_2-3.jpg', sold: 200 },
  { id: 2838, name: 'Perfect Concealer', category: 'Body Care', price: 28, rating: 5, tags: ['cosmetic', 'skincare'], image: 'img_8-3.jpg', sold: 190 },
  { id: 2840, name: 'Soft Hand Lotion', category: 'Body Care', price: 25, rating: 4, tags: ['cosmetic', 'skincare'], image: 'img_7-3.jpg', sold: 180 },
  { id: 2842, name: 'Foundation Lotion', category: 'Body Care', price: 35, compareAtPrice: 45, rating: 3, tags: ['cosmetic', 'skincare'], image: 'img_6-3.jpg', sold: 170 },
  { id: 2844, name: 'Soft BB Cream', category: 'Body Care', price: 25, rating: 4, tags: ['cosmetic', 'skincare'], image: 'img_5-3.jpg', sold: 160 },
  { id: 2846, name: 'Face Day Cream', category: 'Body Care', price: 20, compareAtPrice: 28, rating: 5, tags: ['cosmetic', 'facecare'], image: 'img_4-3.jpg', sold: 150 },
  { id: 2848, name: 'Face BB CReam', category: 'Body Care', price: 15, compareAtPrice: 27, rating: 5, tags: ['cosmetic', 'facecare'], image: 'img_3-3.jpg', sold: 140 },
  { id: 2850, name: 'Silk Hand Cream', category: 'Body Care', price: 15, rating: 3, tags: ['cosmetic', 'skincare'], image: 'img_2-3.jpg', sold: 130 },
  { id: 2852, name: 'Basic Foundation', category: 'Body Care', price: 15, compareAtPrice: 27, rating: 5, tags: ['cosmetic', 'skincare'], image: 'img_1-3.jpg', sold: 52 },
  { id: 3095, name: 'Lipstick Brown', category: 'Cosmetics', price: 35, compareAtPrice: 45, rating: 5, tags: ['cosmetic', 'perfume'], image: 'img_2-3-1.jpg', sold: 95 },
  { id: 3097, name: 'Perfect Concealer', category: 'Cosmetics', price: 28, rating: 3, tags: ['cosmetic', 'perfume'], image: 'img_2-2-1.jpg', sold: 47 },
  { id: 3099, name: 'Dropped Body Oil', category: 'Cosmetics', price: 15, compareAtPrice: 27, rating: 5, tags: ['cosmetic', 'perfume'], image: 'img_2-1-1.jpg', sold: 49 },
  { id: 3101, name: 'Soft Hand Lotion', category: 'Cosmetics', price: 25, rating: 5, tags: ['cosmetic', 'perfume'], image: 'img_2-4.jpg', sold: 90 },
  { id: 3103, name: 'Nail Polish Nova', category: 'Cosmetics', price: 15, rating: 4, tags: ['cosmetic', 'perfume'], image: 'img_2-5.jpg', sold: 53 },
  { id: 3105, name: 'Dropped Beard Oil', category: 'Cosmetics', price: 28, rating: 3, tags: ['cosmetic', 'perfume'], image: 'img_2-6.jpg', sold: 55 },
  { id: 3107, name: 'Mascara', category: 'Cosmetics', price: 35, compareAtPrice: 45, rating: 4, tags: ['cosmetic', 'perfume'], image: 'img_2-7.jpg', sold: 93 },
  { id: 3109, name: 'Cream Soap', category: 'Cosmetics', price: 25, rating: 5, tags: ['cosmetic', 'perfume'], image: 'img_2-8.jpg', sold: 59 },
  { id: 3111, name: 'Body Oil & Lotion', category: 'Cosmetics', price: 15, compareAtPrice: 27, rating: 4, tags: ['cosmetic', 'perfume'], image: 'img_2-9.jpg', sold: 61 },
  { id: 3201, name: 'Dropped Body Oil', category: 'Hair Care', price: 15, compareAtPrice: 27, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_1.jpg', sold: 21 },
  { id: 3203, name: 'Perfect Concealer', category: 'Hair Care', price: 28, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_2.jpg', sold: 23 },
  { id: 3205, name: 'Lipstick Brown', category: 'Hair Care', price: 35, compareAtPrice: 45, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_3.jpg', sold: 25 },
  { id: 3207, name: 'Soft Hand Lotion', category: 'Hair Care', price: 25, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_4.jpg', sold: 27 },
  { id: 3209, name: 'Nail Polish Nova', category: 'Hair Care', price: 15, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_5.jpg', sold: 29 },
  { id: 3211, name: 'Dropper Beard Oil', category: 'Hair Care', price: 28, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_6.jpg', sold: 31 },
  { id: 3213, name: 'Mascara', category: 'Hair Care', price: 35, compareAtPrice: 45, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_7.jpg', sold: 33 },
  { id: 3215, name: 'Cream Soap', category: 'Hair Care', price: 25, rating: 0, tags: ['cosmetic', 'perfume'], image: '3_img_8.jpg', sold: 35 },
].map(({ id, image, ...p }) => ({
  ...p,
  sku: String(id),
  stock: 50,
  numReviews: p.rating ? 1 : 0,
  isFeatured: p.category === 'Body Care',
  shortDescription: COPY.en.shortDescription,
  description: COPY.en.description,
  translations: productTranslations(p.name),
  weight: '2 kg',
  dimensions: '2 × 4 × 5 cm',
  images: [image],
}));

const COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, description: '10% off your order' },
  { code: 'COSMECOS', type: 'percent', value: 25, description: '25% off all products' },
  { code: 'FREESHIP', type: 'free_shipping', description: 'Free shipping on any order' },
];

async function seed() {
  const fresh = process.argv.includes('--fresh');
  await connectDB(env.mongoUri);

  if (fresh) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Coupon.deleteMany({})]);
    console.log('Cleared products, categories and coupons');
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cosmecos.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Cosmecos Admin',
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
    });
    console.log(`Created admin ${adminEmail}`);
  }

  const catIds = {};
  for (const c of CATEGORIES) {
    const translations = CATEGORY_TRANSLATIONS[c.name];
    let doc = await Category.findOne({ name: c.name });
    if (!doc) doc = await Category.create({ ...c, translations });
    else if (!doc.translations?.az?.name) {
      // Categories seeded before translations existed get them now.
      doc.translations = translations;
      await doc.save();
    }
    catIds[c.name] = doc._id;
  }

  // Demo names repeat across categories, so a product is identified by name + category.
  const hour = 60 * 60 * 1000;
  const start = Date.now() - PRODUCTS.length * hour;
  let created = 0;
  let updated = 0;
  for (const [order, { images, ...p }] of PRODUCTS.entries()) {
    const category = catIds[p.category];
    const existing = await Product.findOne({ name: p.name, category });
    if (existing) {
      // Upgrade products from earlier seeds: real copy instead of placeholder text, plus translations.
      // Text an admin has edited is left alone.
      let changed = false;
      const placeholder = existing.shortDescription?.startsWith(LEGACY_SHORT_DESCRIPTION_START);
      if (placeholder) {
        existing.shortDescription = p.shortDescription;
        existing.description = p.description;
        changed = true;
      }
      if (!existing.translations?.az?.name) {
        // Translated descriptions only match the demo copy; for edited text, add just the names.
        existing.translations = placeholder
          ? p.translations
          : { az: { name: p.translations.az.name }, ru: { name: p.translations.ru.name } };
        changed = true;
      }
      if (changed) {
        await existing.save();
        updated += 1;
      }
      continue;
    }
    const doc = await Product.create({
      ...p,
      images: images.map((file) => ({ url: demoImage(file), alt: p.name })),
      category,
      createdBy: admin._id,
    });
    // Spread creation dates so sorting by "newest" follows the demo's publishing order.
    await Product.updateOne(
      { _id: doc._id },
      { $set: { createdAt: new Date(start + order * hour) } },
      { timestamps: false }
    );
    created += 1;
  }

  for (const c of COUPONS) {
    await Coupon.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
  }

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${created} new products (${updated} updated), ${COUPONS.length} coupons`
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
