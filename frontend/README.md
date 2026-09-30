# Cosmecos Web

React storefront for the Cosmecos cosmetics store. The visual style is inspired by the Cosmecos theme: nude/beige palette, serif display type, and slow, eased motion. All copy, photography and branding are original or royalty-free.

**Stack:** React 19, Vite, Tailwind CSS 4, Framer Motion, React Router, Axios, TanStack Query (server state), Zustand (auth/UI state), React Hook Form + Zod, lucide-react, Embla carousel, Sonner toasts.

## Run

```bash
# 1. API (see ../backend/README.md)
cd ../backend && npm run seed && npm run dev

# 2. Web
cd ../frontend
npm install
npm run dev          # http://localhost:5173 (proxies /api and /uploads to :5000)
npm run build        # production build in dist/
npm test             # unit + integration tests (boots the real API on an in-memory MongoDB)
```

Environment variables (`.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API origin for production builds. Leave empty in dev to use the proxy. |
| `VITE_PROXY_TARGET` | Backend the dev proxy points at (default `http://localhost:5000`). |
| `VITE_PROMO_VIDEO_URL` | Optional mp4. When set, the home promo banner shows a play button that opens it. |

## Languages (AZE / ENG / RU)

All interface text lives in `src/i18n/locales/{az,en,ru}.json` (react-i18next); the three files have identical keys, which a test enforces. The header dropdown and the mobile-menu toggle switch language; the choice is saved in `localStorage` (`cosmecos-lang`), and first-time visitors get their browser language when it is one of the three.

Product and category names and descriptions come from the API in the current language: every storefront request sends an `X-Language` header, catalog queries are keyed by language, and the cart/wishlist refetch on a switch. Admins enter the Azerbaijani and Russian versions in the product form's **Translations** card (blank fields fall back to English). Shopper-facing API error messages are translated by the API too.

The admin panel (`/admin`) is translated as well: navigation, dashboard counters and charts, product/order/customer tables, the product form, image uploader, status badges, dialogs and toasts (keys under `admin.*`). Switch language from the sidebar or the admin sign-in card. Admin requests add an `X-Content-Original: 1` header, so product and category data arrive in their original fields for editing, while API messages still follow the chosen language. Azerbaijani dates are formatted from built-in month names, because Chrome has no Azerbaijani calendar data.

## Pages

| Route | What's there |
|---|---|
| `/` | Hero slider (staggered text reveal, clip-path image reveal, floating product card, parallax), feature strip, bento category grid, best-seller carousel, about teaser with counters, countdown promo, tabbed product grid, testimonials, marquee |
| `/about-us` | Brand story with parallax image grid, animated stats, values, timeline, team with hover socials |
| `/shop` | Filter sidebar (categories, dual price slider, tags, skin type, availability), sort menu, grid density, filter chips, pagination. All filter state lives in the URL. Mobile filter drawer. |
| `/product/:slug` | Gallery (hover zoom, swipe, thumbnails, lightbox), shade swatches / size pills, quantity, wishlist, accordion (description, ingredients, how to use, shipping), related products |
| `/contacts` | Info cards, validated contact form (saved via API), store locator with switchable map embed and directions link |
| `/cart` | Line items, quantity/remove, coupon code (validated by the server), free-shipping progress, summary |
| `/checkout` | 3-step checkout (shipping → payment → review) with per-step validation and an animated stepper |
| `/order-success/:id` | Animated confirmation with the order summary |
| `/wishlist` | Saved items with "Move to cart". Products with variants use the first in-stock variant. |
| `/profile` | Order history (status timeline, cancel), account details, change password |
| `/login`, `/register` | Split-screen auth pages. An auth modal also opens in place when a guest tries a protected action. |

## Admin panel (`/admin`)

Sign in at `/admin/login` with an admin account. The seed creates `admin@cosmecos.com` / `Admin123!`. Customer credentials are refused there and never create a session. Admin users also see an "Admin panel" icon in the storefront header.

| Route | What's there |
|---|---|
| `/admin` | Stat counters (revenue, orders, products, customers), 30-day revenue chart with hover tooltips and a table view, orders by status, recent orders, low stock, top sellers |
| `/admin/products` | Datatable: search, category / visibility / stock filters, sort, pagination, inline show/hide switch, edit, delete (with confirmation) |
| `/admin/products/new`, `/:id/edit` | Product form: details, pricing, stock, tags, skin types, featured/active, variant editor, and multi-image upload (drag & drop, previews, image URLs, remove saved images, upload progress) |
| `/admin/orders` | Status tabs, order-number search, pagination. The "Manage" drawer moves an order to its next allowed status (tracking number when shipping, optional note), toggles payment, and shows items, address and history. |
| `/admin/customers` | Search, role filter, change role, enable/disable accounts (not your own) |

The admin panel is a separate lazy-loaded bundle, so shoppers never download it.

## How it fits together

- **API layer:** `lib/api.js` sets up a shared Axios instance. A request interceptor adds `Authorization: Bearer <token>`. A response interceptor turns every error into an `ApiError` with the server's message and field errors, and signs the user out on a 401. All hooks go through it, and multipart uploads report progress.
- **Session:** the token and user are saved in localStorage. On every page load `useSessionBootstrap` checks the token against `/auth/me`, and protected routes wait for that check instead of flashing a redirect. Signing in or out in one tab updates the other open tabs.
- **Toasts:** every cart, wishlist, order and admin action confirms or reports errors through Sonner, e.g. "Added to your bag", "saved to your wishlist", "Product created successfully".
- **Guest actions:** cart and wishlist live in the user's account on the API. When a guest clicks "Add to cart" or the heart, the sign-in modal opens and the action runs automatically after they sign in or register (`useRequireAuth` + `pendingAction` in `store/ui.js`).
- **Prices** always come from the API. Coupon discounts are recalculated by the server whenever the cart subtotal changes (`useCouponTotals`).
- **Motion:** shared easing and variants live in `lib/motion.js`. `MotionConfig reducedMotion="user"` respects the OS "reduce motion" setting, as does the CSS.
- **Code-splitting:** every page except Home is lazy-loaded.

```
src/
  components/
    layout/   Header (sticky, hides on scroll down), AnnouncementBar, Footer, MobileMenu, SearchOverlay, CartDrawer
    home/     Hero, Features, CategoriesGrid, BestSellers, AboutTeaser, PromoBanner, ProductTabs, Testimonials, BrandMarquee
    product/  ProductCard, ProductGrid, ProductCarousel, ProductGallery, FilterSidebar, PriceRange, OrderSummary, …
    auth/     AuthModal, AuthForms, ProtectedRoute
    ui/       Button, Field, Drawer/Modal, Accordion, Dropdown, Pagination, Counter, Reveal, PageHero, …
  hooks/      React Query hooks: catalog, cart, wishlist, orders, auth, coupon
  store/      Zustand: auth (persisted), ui
  pages/      One file per route
  lib/        api client, formatting, motion presets
```

## Not included

- Online card payments are not connected. Checkout records the chosen method and no card data is collected.
- The newsletter form only confirms locally. No mailing provider is wired up.
