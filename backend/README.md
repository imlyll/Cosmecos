# Cosmecos API

REST API for the Cosmecos premium cosmetics store: Node.js, Express 5, MongoDB/Mongoose, JWT auth, Zod validation, Multer + Cloudinary image uploads.

## Quick start

```bash
cd backend
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed              # admin user + sample categories/products (add --fresh to wipe first)
npm run dev               # http://localhost:5000/api
npm run smoke             # end-to-end test against an in-memory MongoDB
```

The seeded admin is `admin@cosmecos.com` / `Admin123!` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

**Images:** if all three `CLOUDINARY_*` variables are set, uploads go to Cloudinary. Otherwise they are written to `./uploads` and served at `/uploads/...`, so local development needs no Cloudinary account.

## Project structure

```
src/
  app.js / server.js     Express app and process bootstrap
  config/                env, database, cloudinary
  models/                User, Category, Product (+variants), Cart, Wishlist, Order
  validators/            Zod schemas per module
  middleware/            auth (protect / optionalAuth / isAdmin), validate, upload, error
  services/              pricing, stock reservation, cart view building
  controllers/           request handlers per module
  routes/                routers mounted under /api
  scripts/               seed + smoke test
```

## Conventions

- Auth: `Authorization: Bearer <token>`.
- Success: `{ "success": true, ... }`. Errors: `{ "success": false, "message": "...", "errors"?: [{ field, message }] }`.
- Lists return `pagination: { page, limit, total, pages, hasNext, hasPrev }`.
- Product and admin write endpoints accept **JSON or multipart/form-data**. In multipart, send arrays/objects (`variants`, `imageUrls`, `removeImageIds`) as JSON strings; `tags` may be comma-separated.

## Endpoints

### Auth `/api/auth`
| Method | Path | Access | Body |
|---|---|---|---|
| POST | `/register` | public | `name, email, password` (8+ chars, letter + number) |
| POST | `/login` | public | `email, password` |
| GET | `/me` | user | |
| PATCH | `/me` | user | `name?, phone?, address?` |
| PATCH | `/me/password` | user | `currentPassword, newPassword` (returns a new token) |

Register and login are rate-limited: 20 attempts per 15 minutes per IP in production, 200 otherwise. Set `AUTH_RATE_LIMIT` to override. New accounts always get the `user` role.

### Categories `/api/categories`
| Method | Path | Access |
|---|---|---|
| GET | `/` | public (includes `productCount`) |
| GET | `/:idOrSlug` | public |
| POST | `/` | admin, `name, description?, parent?`, optional `image` file |
| PUT | `/:id` | admin |
| DELETE | `/:id` | admin (refused while products or sub-categories exist) |

### Products `/api/products`
| Method | Path | Access |
|---|---|---|
| GET | `/` | public |
| GET | `/filters` | public: brands, tags, price range for the shop sidebar |
| GET | `/:idOrSlug` | public: product + 4 related |
| POST | `/` | admin |
| PUT | `/:id` | admin |
| DELETE | `/:id` | admin (also removes it from carts and wishlists) |
| DELETE | `/:id/images/:imageId` | admin |

**List query params:** `page`, `limit` (≤100), `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating`, `best_selling`), `search`, `category` (id or slug, includes direct sub-categories), `brand`, `tags` (comma list), `skinType`, `minPrice`, `maxPrice`, `inStock`, `featured`, `onSale`, `includeInactive` and `active=true|false` (admin only).

**Create/update fields:** `name, description, category, price` (required on create), `brand, shortDescription, ingredients, howToUse, tags, skinTypes, compareAtPrice, sku, stock, isFeatured, isActive, variants[], imageUrls[]`, plus up to 8 `images` files (JPEG/PNG/WebP/AVIF, 5 MB each). On update you can also send `removeImageIds[]`, and an empty `compareAtPrice` clears the sale price.

A variant is `{ name, sku?, shade?, colorHex?, size?, price?, stock, image? }`. When a product has variants, its `stock` is the sum of variant stock, and cart/order lines must include a `variantId`. A variant without a `price` uses the product price.

### Cart `/api/cart` (user)
| Method | Path | Body |
|---|---|---|
| GET | `/` | |
| POST | `/items` | `productId, variantId?, quantity` (merges with an existing line) |
| PATCH | `/items/:itemId` | `quantity` |
| DELETE | `/items/:itemId` | |
| DELETE | `/` | clears the cart |

Cart responses use live prices and include `items[]` (with `unitPrice`, `subtotal`, `availableStock`, `isAvailable`), `itemCount`, `itemsPrice`, `shippingPrice`, `taxPrice`, `totalPrice` and `amountToFreeShipping`.

### Wishlist `/api/wishlist` (user)
| Method | Path | Body |
|---|---|---|
| GET | `/` | |
| POST | `/toggle` | `productId` → returns `added: true/false` |
| DELETE | `/:productId` | |
| DELETE | `/` | |

### Orders `/api/orders` (user)
| Method | Path | Notes |
|---|---|---|
| POST | `/` | `shippingAddress, paymentMethod?, notes?, items?`. Without `items` the order is built from the cart, which is then cleared. |
| GET | `/` | own orders, `?status=&page=&limit=` |
| GET | `/:id` | owner or admin |
| PATCH | `/:id/cancel` | owner, only while `Pending` or `Processing`; restores stock |

`shippingAddress`: `fullName, phone, line1, line2?, city, state?, postalCode, country`. `paymentMethod`: `card`, `paypal` or `cash_on_delivery`.

Prices always come from the database, never from the client. Stock is decremented atomically, so two checkouts cannot oversell. If any line fails, stock already taken for the other lines is released.

### Coupons & contact
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/coupons/validate` | user | `{ code }` → coupon + cart totals with the discount applied |
| POST | `/api/contact` | public (rate-limited) | `name, email, message, phone?, subject?` |

Orders accept an optional `couponCode`. Coupon types are `percent` (with an optional `maxDiscount` cap), `fixed` and `free_shipping`, and each can have a `minSubtotal`, an `expiresAt` and a `usageLimit`. Uses are counted atomically and given back when an order is cancelled. The seed creates `WELCOME10`, `GLOW25` (25% off orders over $80) and `FREESHIP`.

### Admin `/api/admin` (admin)
| Method | Path | Notes |
|---|---|---|
| GET | `/stats` | customers, products, revenue, average order value, orders by status, 30-day sales, low stock, top products, recent orders |
| GET | `/orders` | `?status=&user=&search=<orderNumber>&from=&to=&page=&limit=` |
| PATCH | `/orders/:id/status` | `status, note?, trackingNumber?` |
| PATCH | `/orders/:id/payment` | `isPaid` |
| GET | `/users` | `?role=&search=&page=&limit=`, with each user's `orderCount` and `totalSpent` |
| GET | `/users/:id` | user + 10 recent orders |
| PATCH | `/users/:id` | `role?, isActive?` (admins can't change their own account) |
| GET/POST | `/coupons` | list / create coupons |
| PATCH/DELETE | `/coupons/:id` | update / delete a coupon |
| GET | `/messages` | contact form messages |
| PATCH | `/messages/:id/read` | mark a message read |

Order status flow: `Pending → Processing → Shipped → Delivered`. `Pending` can also go straight to `Shipped`, and `Pending` or `Processing` can go to `Cancelled`. Cancelling restores stock. Delivering a cash-on-delivery order marks it paid. Every change is recorded in `statusHistory`.
