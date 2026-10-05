import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

// Runs against `vite preview` of the production build and the API on an in-memory MongoDB (see globalSetup.js).

const api = () => JSON.parse(process.env.AUDIT_API);

// Google's sign-in script is replaced by a stand-in with the same two calls the app uses, so the tests
// never reach Google. Its button hands our callback `window.__googleToken` (see withGoogle below).
const FAKE_GIS = `
  window.google = { accounts: { id: {
    initialize(config) { window.__gisConfig = config; },
    renderButton(el, options) {
      window.__gisOptions = options;
      el.innerHTML = '';
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Continue with Google';
      b.onclick = () => window.__gisConfig.callback({ credential: window.__googleToken });
      el.append(b);
    },
  } } };`;

// English UI for stable selectors.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cosmecos-lang', 'en'));
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_GIS })
  );
});

async function login(page, email, password, path = '/login') {
  await page.goto(path);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').first().click();
}

const PAGES = ['/', '/about-us', '/shop', '/product/SLUG', '/contacts', '/login', '/register', '/cart', '/checkout', '/profile', '/wishlist'];

test.describe('pages', () => {
  for (const p of PAGES) {
    test(`opens ${p} without console errors (desktop + 375px)`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      const url = p.replace('SLUG', api().serumSlug);
      const res = await page.goto(url); // direct load == browser refresh
      expect(res.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      expect(await page.locator('#root').innerText()).not.toBe('');

      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
      expect.soft(overflow, `horizontal overflow at 375px on ${p}`).toBeLessThanOrEqual(0);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  for (const p of ['/profile', '/checkout', '/wishlist', '/cart']) {
    test(`guest is redirected from ${p} to /login`, async ({ page }) => {
      await page.goto(p);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('unknown page shows NotFound (200 SPA)', async ({ page }) => {
    const res = await page.goto('/no-such-page');
    expect(res.status()).toBe(200);
    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });
});

test('user flow: register → OTP → login → shop → product → cart → checkout → order', async ({ page, request }) => {
  const email = `e2e${Date.now()}@test.com`;
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('E2E User');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('Passw0rd1');
  await page.locator('input[name="confirm"]').fill('Passw0rd1');
  await page.getByRole('button', { name: 'Create account' }).click();

  const digits = page.locator('input[inputmode="numeric"]');
  await expect(digits.first()).toBeVisible();
  const { code } = await (await request.get(`${api().url}/__audit__/otp/${email}`)).json();
  for (let i = 0; i < 6; i++) await digits.nth(i).fill(code[i]);
  // A full code submits automatically.
  await expect(page).not.toHaveURL(/register/, { timeout: 15_000 });

  // Fresh session, then a normal login.
  await page.evaluate(() => localStorage.removeItem('cosmecos-auth'));
  await login(page, email, 'Passw0rd1');
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/shop');
  await page.getByRole('link', { name: /Serum/ }).first().click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.waitForTimeout(800);

  await page.goto('/checkout');
  await page.locator('input[name="fullName"]').fill('E2E User');
  await page.locator('input[name="phone"]').fill('+994501234567');
  await page.locator('input[name="line1"]').fill('Nizami 1');
  await page.locator('input[name="city"]').fill('Baku');
  await page.locator('input[name="postalCode"]').fill('AZ1000');
  await page.locator('input[name="country"]').fill('Azerbaijan');
  for (let i = 0; i < 4; i++) {
    const place = page.getByRole('button', { name: 'Place order' });
    if (await place.isVisible()) break;
    await page.getByRole('button', { name: /Continue to/ }).click();
    await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page).toHaveURL(/order-success/, { timeout: 15_000 });
});

test('wishlist add and remove', async ({ page }) => {
  await login(page, 'admin@a.com', 'Admin1234');
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto(`/product/${api().serumSlug}`);
  await page.getByRole('button', { name: /Add .*Serum to wishlist/ }).first().click();
  await expect(page.getByRole('button', { name: /Remove .*Serum from wishlist/ }).first()).toBeVisible();
  await page.goto('/wishlist');
  await expect(page.getByText('Serum').first()).toBeVisible();
  await page.getByRole('button', { name: /Remove .*Serum from wishlist/ }).first().click();
  await page.reload();
  await expect(page.getByRole('button', { name: /Remove .*Serum from wishlist/ })).toHaveCount(0);
});

test('admin flow: login → new product → visible in shop', async ({ page }) => {
  await login(page, 'admin@a.com', 'Admin1234', '/admin/login');
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
  await page.goto('/admin/products/new');
  await page.locator('input[name="name"]').first().fill('E2E Night Cream');
  await page.locator('select#category').selectOption({ index: 1 });
  await page.locator('textarea[name="description"]').first().fill('A rich night cream for testing.');
  await page.locator('input[name="price"]').fill('25');
  await page.locator('input[name="stock"]').fill('7');
  await page.locator('input[type="file"]').first().setInputFiles(fileURLToPath(new URL('../public/favicon.png', import.meta.url)));
  await page.getByRole('button', { name: 'Create product' }).first().click();
  await expect(page).not.toHaveURL(/products\/new/, { timeout: 15_000 });

  await page.goto('/shop');
  await expect(page.getByText('E2E Night Cream').first()).toBeVisible();
});

test('forgot password: login → "Forgot password?" → code → new password → signed in', async ({ page, request }) => {
  const { url } = api();
  const email = `reset${Date.now()}@test.com`;
  // A verified account, created through the API.
  await request.post(`${url}/api/auth/register`, { data: { name: 'Reset User', email, password: 'OldPassw0rd' } });
  const { code: signupCode } = await (await request.get(`${url}/__audit__/otp/${email}`)).json();
  await request.post(`${url}/api/auth/verify-otp`, { data: { email, code: signupCode } });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  // Wait for the page transition, so the email goes into the new form and not the outgoing one.
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveCount(1);
  await page.locator('input[name="email"]').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('input[name="code"]')).toBeVisible();

  // The email is sent in the background; wait for the reset code to arrive.
  let code;
  await expect(async () => {
    const mail = await (await request.get(`${url}/__audit__/otp/${email}`)).json();
    expect(mail.subject).toContain('password reset');
    code = mail.code;
  }).toPass({ timeout: 10_000 });

  await page.locator('input[name="code"]').fill(code);
  await page.locator('input[name="password"]').fill('NewPassw0rd');
  await page.locator('input[name="confirm"]').fill('NewPassw0rd');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

  // Signed out, the new password works and the old one does not.
  await page.evaluate(() => localStorage.removeItem('cosmecos-auth'));
  await login(page, email, 'OldPassw0rd');
  await expect(page.getByRole('alert')).toBeVisible();
  await login(page, email, 'NewPassw0rd');
  await expect(page).not.toHaveURL(/\/login/);
});

test('forgot password is reachable from the sign-in modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Send code' })).toBeVisible();
});

// --- Sign in with Google --------------------------------------------------------------------------
// The ID token is signed by the test API's fake Google (backend/tests/server.js), so everything after
// Google (our API's token check, the session, the redirect) runs for real.

async function withGoogle(page, request, claims, options = {}) {
  const { token } = await (await request.post(`${api().url}/__audit__/google-token`, { data: { claims, ...options } })).json();
  await page.addInitScript((t) => (window.__googleToken = t), token);
}

const googleId = () => {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { sub: `g${id}`, email: `g${id}@gmail.com`, name: 'Gül Google' };
};

test('Google: sign up from /register, no code needed, lands signed in', async ({ page, request }) => {
  const claims = googleId();
  await withGoogle(page, request, claims);
  await page.goto('/register');
  await expect(page.getByText(/^or$/i)).toBeVisible();
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByText(claims.email).first()).toBeVisible();
  expect(await page.evaluate(() => window.__gisOptions.locale)).toBe('en');
});

test('Google: an account registered with the same email is reused', async ({ page, request }) => {
  const { url } = api();
  const claims = googleId();
  await request.post(`${url}/api/auth/register`, { data: { name: 'Gül', email: claims.email, password: 'Passw0rd1' } });
  const { code } = await (await request.get(`${url}/__audit__/otp/${claims.email}`)).json();
  const registered = await (await request.post(`${url}/api/auth/verify-otp`, { data: { email: claims.email, code } })).json();

  await withGoogle(page, request, claims);
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/profile/);
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('cosmecos-auth')).state.user);
  expect(session._id).toBe(registered.user._id);
});

test('Google: works from the sign-in modal', async ({ page, request }) => {
  await withGoogle(page, request, googleId());
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect.poll(() => page.evaluate(() => Boolean(JSON.parse(localStorage.getItem('cosmecos-auth'))?.state?.token))).toBe(true);
});

test('Google: a rejected token shows an error and stays signed out', async ({ page, request }) => {
  await withGoogle(page, request, { ...googleId(), aud: 'another-app.apps.googleusercontent.com' });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText('Google sign-in failed. Please try again.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('Google: the button follows the site language', async ({ page, request }) => {
  await withGoogle(page, request, googleId());
  await page.addInitScript(() => localStorage.setItem('cosmecos-lang', 'az'));
  await page.goto('/login');
  await expect(page.getByText('və ya')).toBeVisible();
  expect(await page.evaluate(() => window.__gisOptions.locale)).toBe('az');
});
