import { chromium, type Browser, type Page } from 'playwright';
import { createBrowserE2eApp, type BrowserE2eApp } from './browser-e2e-app.js';

const password = 'correct-horse-battery';

/**
 * Opens a page and waits for Vite client assets to settle after SSR.
 *
 * @param {Page} page - Playwright page.
 * @param {string} url - Absolute URL to open.
 * @returns {Promise<void>}
 */
async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

describe('Auth UI (browser e2e)', () => {
  let harness: BrowserE2eApp;
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    harness = await createBrowserE2eApp();
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
    await harness.close();
  });

  it('embeds CSRF meta on login and register pages', async () => {
    await gotoHydrated(page, `${harness.baseURL}/login`);
    const loginToken = await page
      .locator('meta[name="csrf-token"]')
      .getAttribute('content');
    expect(loginToken).toBeTruthy();

    await gotoHydrated(page, `${harness.baseURL}/register`);
    const registerToken = await page
      .locator('meta[name="csrf-token"]')
      .getAttribute('content');
    expect(registerToken).toBeTruthy();
  });

  it('registers then lands on login, logs in to home, logs out to login', async () => {
    await gotoHydrated(page, `${harness.baseURL}/register`);
    await page.getByLabel('Email').fill('browser-e2e@example.com');
    await page.getByLabel('Username').fill('browsere2e');
    await page.getByLabel('Display name').fill('Browser E2E');
    await page.getByLabel('Password').fill(password);

    const registerResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/user') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create account' }).click();
    expect((await registerResponse).status()).toBe(201);
    await page.waitForURL((url) => url.pathname === '/login');

    await page.getByLabel('Email or username').fill('browsere2e');
    await page.getByLabel('Password').fill(password);
    const loginResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/auth/login') &&
        res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Log in' }).click();
    expect((await loginResponse).status()).toBe(200);
    await page.waitForURL((url) => url.pathname === '/');

    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL((url) => url.pathname === '/login');
  });

  it('shows an inline error for invalid credentials', async () => {
    await gotoHydrated(page, `${harness.baseURL}/register`);
    await page.getByLabel('Email').fill('valid-user@example.com');
    await page.getByLabel('Username').fill('validuser');
    await page.getByLabel('Display name').fill('Valid');
    await page.getByLabel('Password').fill(password);
    const registerResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/user') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create account' }).click();
    expect((await registerResponse).status()).toBe(201);
    await page.waitForURL((url) => url.pathname === '/login');

    await page.getByLabel('Email or username').fill('validuser');
    await page.getByLabel('Password').fill('wrong-password-xx');
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.getByRole('alert').waitFor();
    expect(await page.getByRole('alert').textContent()).toBe(
      'Invalid credentials.',
    );
  });

  it('redirects authenticated guests away from login and register', async () => {
    await gotoHydrated(page, `${harness.baseURL}/register`);
    await page.getByLabel('Email').fill('guest-only@example.com');
    await page.getByLabel('Username').fill('guestonly');
    await page.getByLabel('Display name').fill('Guest');
    await page.getByLabel('Password').fill(password);
    const registerResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/user') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create account' }).click();
    expect((await registerResponse).status()).toBe(201);
    await page.waitForURL((url) => url.pathname === '/login');

    await page.getByLabel('Email or username').fill('guestonly');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto(`${harness.baseURL}/login`);
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto(`${harness.baseURL}/register`);
    await page.waitForURL((url) => url.pathname === '/');
  });
});
