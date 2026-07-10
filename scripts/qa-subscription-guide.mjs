import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const host = '47.82.105.81';
const keyPath = process.env.SSH_KEY_PATH || 'C:\\Users\\Administrator\\Downloads\\server_key_restrict.pem';
const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

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

await page.goto(`${baseURL}/console/subscription`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'output/playwright/subscription-guide.png', fullPage: false });

const report = await page.evaluate(() => {
  const guide = document.querySelector('[data-matrix-subscription-guide]');
  const guideText = guide?.innerText.replace(/\s+/g, ' ') || '';
  const links = [...(guide?.querySelectorAll('a') || [])].map((link) => ({
    text: link.innerText.trim(),
    href: link.getAttribute('href'),
  }));
  const bodyText = document.body.innerText.replace(/\s+/g, ' ');
  return {
    url: location.href,
    guideExists: Boolean(guide),
    guideText,
    links,
    bodySample: bodyText.slice(0, 1400),
    hasNativeStripeCreem: bodyText.includes('Stripe/Creem'),
    hasAlipay: guideText.includes('Alipay'),
    hasMail: guideText.includes('3315419516@qq.com') || links.some((link) => (link.href || '').startsWith('mailto:')),
    hasNoWechatCheckout: !/微信收银台|ZPay\s*微信/.test(bodyText),
  };
});

await browser.close();

const failures = [];
if (!report.guideExists) failures.push('Subscription guide was not injected');
if (!/Capacity plans|Starter 50|Scale 200/.test(report.guideText)) failures.push('Subscription guide does not explain capacity packs');
if (!/Alipay/.test(report.guideText)) failures.push('Subscription guide does not state Alipay-only top-up');
if (!report.hasMail) failures.push('Subscription guide does not provide support email');
if (!report.links.some((link) => link.href === '/wallet' || link.href === '/topup')) failures.push('Subscription guide lacks wallet/top-up link');
if (!report.links.some((link) => (link.href || '').startsWith('mailto:3315419516@qq.com'))) failures.push('Subscription guide lacks mailto link');
if (report.hasNativeStripeCreem) failures.push('Subscription page still exposes Stripe/Creem wording');
if (!report.hasNoWechatCheckout) failures.push('Subscription page contains WeChat checkout wording');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report, consoleErrors: [...new Set(errors)] }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ report, consoleErrors: [...new Set(errors)] }, null, 2));
