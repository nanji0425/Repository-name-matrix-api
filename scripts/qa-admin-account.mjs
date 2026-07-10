import { chromium } from 'playwright';
import { baseURL, readSecret } from './qa-helpers.mjs';

const username = process.env.QA_ADMIN_USERNAME || process.env.NEW_API_ADMIN_USERNAME || readSecret('NEW_API_ADMIN_USERNAME');
const password = process.env.QA_ADMIN_PASSWORD || process.env.NEW_API_ADMIN_PASSWORD || readSecret('NEW_API_ADMIN_PASSWORD');

if (!username || !password) {
  throw new Error('Admin username/password are required for admin account QA');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});

const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const loginResponse = await page.request.post(`${baseURL}/api/user/login`, {
  ignoreHTTPSErrors: true,
  data: { username, password },
});
const loginJson = await loginResponse.json().catch(() => null);

if (!loginJson?.success) {
  throw new Error(`Admin login failed: ${loginJson?.message || loginResponse.status()}`);
}

const userId = String(loginJson.data.id);
const userData = loginJson.data;

await page.route('**/api/**', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      'New-Api-User': userId,
    },
  });
});

await page.addInitScript(({ userId, userData }) => {
  localStorage.setItem('uid', userId);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('locale', 'en');
  localStorage.setItem('matrix-lang', 'en');
  localStorage.setItem('theme-mode', 'light');
  sessionStorage.removeItem('matrix-admin-login-redirected');
}, { userId, userData });

await page.goto(`${baseURL}/login`, { waitUntil: 'commit', timeout: 60000 });
await page.waitForTimeout(2500);
await Promise.allSettled([
  page.waitForURL(/\/console/, { timeout: 12000 }),
  page.evaluate(({ username, password }) => {
    return fetch('/api/user/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then((response) => response.json());
  }, { username, password }),
]);
const loginRedirect = page.url();

await page.goto(`${baseURL}/console`, { waitUntil: 'commit', timeout: 60000 });
await page.waitForTimeout(6500);

const consoleState = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\s+/g, ' ');
  const lowerText = text.toLowerCase();
  const links = [...document.querySelectorAll('[data-matrix-admin-center] a[href]')].map((link) => ({
    text: link.textContent.trim().replace(/\s+/g, ' '),
    href: link.getAttribute('href') || '',
    target: link.getAttribute('target') || '',
  }));
  return {
    url: location.href,
    title: document.title,
    textSample: text.slice(0, 1000),
    hasAdminCenter: lowerText.includes('matrixapi admin center'),
    hasUsers: /Users|user accounts|用户/.test(text),
    hasStatus: /Site status|Logs|状态|日志/.test(text),
    hasSettings: /Website settings|Settings|设置/.test(text),
    hasChannels: /Channels|渠道/.test(text),
    links,
  };
});

await browser.close();

const failures = [];
if (Number(loginJson.data.role) < 100) failures.push(`Login role is not admin: ${loginJson.data.role}`);
if (!consoleState.hasAdminCenter) failures.push('Console does not show MatrixAPI Admin Center for admin user');
if (!consoleState.hasUsers) failures.push('Admin Center is missing user management wording');
if (!consoleState.hasStatus) failures.push('Admin Center is missing site status wording');
if (!consoleState.hasSettings) failures.push('Admin Center is missing settings wording');
if (!consoleState.hasChannels) failures.push('Admin Center is missing channel management wording');
if (consoleState.links.length < 6) failures.push(`Admin Center has too few management links: ${consoleState.links.length}`);
if (consoleState.links.some((link) => !link.href || link.href === '#')) failures.push('Admin Center contains empty management links');
if (!loginRedirect.includes('/console')) failures.push(`Admin login redirect did not reach console: ${loginRedirect}`);
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const output = {
  login: {
    success: Boolean(loginJson.success),
    user: {
      id: loginJson.data.id,
      username: loginJson.data.username,
      role: loginJson.data.role,
      status: loginJson.data.status,
    },
  },
  consoleState,
  loginRedirect,
  consoleErrors: [...new Set(errors)],
  failures,
};

if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
