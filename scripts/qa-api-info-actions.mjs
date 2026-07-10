import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const host = '47.82.105.81';
const keyPath = process.env.SSH_KEY_PATH || 'C:\\Users\\Administrator\\Downloads\\服务器密钥.pem';
const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';
const supportEmail = '3315419516@qq.com';

function readSecret(name) {
  return execFileSync('ssh', [
    '-i',
    keyPath,
    '-o',
    'StrictHostKeyChecking=no',
    `root@${host}`,
    `cd /root/token_API && sed -n 's/^${name}=//p' .env`,
  ], { encoding: 'utf8' }).trim();
}

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();

const errors = [];
const popups = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('popup', async (popup) => {
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  popups.push({
    url: popup.url(),
    title: await popup.title().catch(() => ''),
  });
  await popup.close().catch(() => {});
});

const loginResponse = await page.request.post(`${baseURL}/api/user/login`, {
  ignoreHTTPSErrors: true,
  data: {
    username: readSecret('NEW_API_ADMIN_USERNAME'),
    password: readSecret('NEW_API_ADMIN_PASSWORD'),
  },
});
const loginJson = await loginResponse.json();
if (!loginJson.success) throw new Error(`Login failed: ${loginJson.message || loginResponse.status()}`);

const userId = String(loginJson.data.id);
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
  localStorage.setItem('locale', 'zh');
  localStorage.setItem('theme-mode', 'dark');
}, { userId, userData: loginJson.data });

await page.goto(`${baseURL}/console`, { waitUntil: 'commit', timeout: 45000 });
for (let attempt = 0; attempt < 18; attempt += 1) {
  const ready = await page.evaluate((supportEmail) => {
    const text = document.body?.innerText || '';
    return text.includes(supportEmail) || document.querySelectorAll('[data-matrix-mail-action]').length > 0;
  }, supportEmail).catch(() => false);
  if (ready) break;
  await page.waitForTimeout(1000);
}
await page.screenshot({ path: 'output/playwright/api-info-actions-before.png', fullPage: false });

const before = await page.evaluate((supportEmail) => {
  const actions = [...document.querySelectorAll('[data-matrix-mail-action]')].map((element) => ({
    text: element.textContent.trim(),
    action: element.getAttribute('data-matrix-mail-action'),
  }));
  return {
    hasSupportEmail: document.body.innerText.includes(supportEmail),
    actions,
  };
}, supportEmail);

await page.evaluate(() => {
  document.querySelector('[data-matrix-mail-action="copy"]')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
  );
});
await page.waitForTimeout(800);
const afterCopy = await page.evaluate(() => ({
  toast: document.querySelector('[data-matrix-toast]')?.textContent || '',
}));

await page.evaluate(() => {
  document.querySelector('[data-matrix-mail-action="open"]')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
  );
});
await page.waitForTimeout(800);
const afterOpen = await page.evaluate(() => ({
  href: location.href,
  toast: document.querySelector('[data-matrix-toast]')?.textContent || '',
}));

await browser.close();

const failures = [];
if (!before.hasSupportEmail) failures.push('Support email is not visible on console API info');
if (!before.actions.some((action) => action.action === 'copy')) failures.push('Support email speed-test action was not patched to copy');
if (!before.actions.some((action) => action.action === 'open')) failures.push('Support email jump action was not patched to mailto');
if (before.actions.some((action) => !['测速', '跳转'].includes(action.text))) failures.push(`Non-support action was patched: ${before.actions.map((action) => action.text).join(', ')}`);
if (!afterCopy.toast.includes(supportEmail)) failures.push(`Copy action did not show support email toast: ${afterCopy.toast}`);
if (!afterOpen.toast.includes(supportEmail)) failures.push(`Jump action did not show support email toast: ${afterOpen.toast}`);
if (popups.some((popup) => /tcptest\.cn\/http\/mailto/.test(popup.url))) failures.push('Support email action still opens tcptest mailto URL');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const report = {
  before,
  afterCopy,
  afterOpen,
  popups,
  consoleErrors: [...new Set(errors)],
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
