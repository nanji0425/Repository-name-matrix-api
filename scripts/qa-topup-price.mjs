import { chromium } from 'playwright';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const statusResponse = await page.request.get(`${baseURL}/api/status`, { ignoreHTTPSErrors: true });
const statusJson = await statusResponse.json();
const price = Number(statusJson.data?.price ?? statusJson.data?.Price);

const response = await page.goto(`${baseURL}/wallet`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(800);

const publicGate = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const text = document.body.innerText.replace(/\s+/g, ' ');
  const links = [...document.querySelectorAll('a[href]')].map((link) => link.getAttribute('href') || '');
  return {
    url: location.href,
    title: document.title,
    hasStaticBundle: /\/static\/js\//.test(html),
    hasAuthGate: Boolean(document.querySelector('.auth-gate-card')),
    hasAmountInput: Boolean(document.querySelector('input[name="amount"]')),
    hasLegalLinks: links.includes('/user-agreement') && links.includes('/privacy-policy'),
    text: text.slice(0, 1200),
    mentionsAlipay: /支付宝|Alipay/i.test(text),
    hasUnsupportedPayment: /WeChat|Stripe|USDT|微信/i.test(text),
  };
});

await loginAndInstallAdmin(page, { maxAttempts: 6 });
await page.goto(`${baseURL}/dashboard/topup`, { waitUntil: 'commit', timeout: 45000 });
await page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {});
await page.waitForTimeout(5000);

const wallet = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const text = document.body.innerText.replace(/\s+/g, ' ');
  return {
    url: location.href,
    title: document.title,
    hasStaticBundle: /\/static\/js\//.test(html),
    bodyLength: text.length,
    hasWalletContent: /Wallet|钱包|Subscription|订阅|余额|balance|top-?up|充值/i.test(text),
    hasLoginGate: Boolean(document.querySelector('.auth-gate-card')),
    hasOldSevenPointThree: /7\.3\s*(CNY|元)/i.test(text),
    hasUnsupportedPayment: /WeChat|Stripe|USDT|微信支付/i.test(text),
    text: text.slice(0, 1400),
  };
});

await browser.close();

const failures = [];
if (!statusJson.success) failures.push(`Status API failed: ${statusResponse.status()}`);
if (Math.abs(price - 1.0) > 0.000001) failures.push(`Expected Price 1.0, got ${price}`);
if (!response || response.status() >= 400) failures.push(`Wallet page returned HTTP ${response?.status()}`);
if (publicGate.hasStaticBundle) failures.push('Public wallet gate should not load SPA /static/js bundles');
if (!publicGate.hasAuthGate) failures.push('Public wallet route should show the unauthenticated login gate');
if (publicGate.hasAmountInput) failures.push('Public wallet route should not expose top-up amount controls before sign-in');
if (!publicGate.mentionsAlipay) failures.push('Public wallet gate should mention Alipay top-up');
if (publicGate.hasUnsupportedPayment) failures.push('Public wallet gate shows unsupported payment wording');
if (!publicGate.hasLegalLinks) failures.push('Public wallet gate should link user agreement and privacy policy');
if (wallet.hasLoginGate) failures.push('Authenticated wallet/top-up route still shows login gate');
if (wallet.bodyLength < 260 || !wallet.hasWalletContent) failures.push('Authenticated wallet page did not render wallet/subscription content');
if (wallet.hasOldSevenPointThree) failures.push('Authenticated wallet page still shows old 7.3 CNY price');
if (wallet.hasUnsupportedPayment) failures.push('Authenticated wallet page shows unsupported payment wording');
if (/\$?NaN/i.test(`${publicGate.text} ${wallet.text}`)) failures.push('Wallet page displays NaN values');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const result = {
  status: {
    price,
    docs_link: statusJson.data?.docs_link,
    logo: statusJson.data?.logo,
  },
  publicGate,
  wallet,
  consoleErrors: [...new Set(errors)],
};

if (failures.length) {
  console.error(JSON.stringify({ failures, result }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
