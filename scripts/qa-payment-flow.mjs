import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin, redact, requestJsonWithRetry } from './qa-helpers.mjs';

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();

const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const { userId } = await loginAndInstallAdmin(page);

const { response: topupInfoResponse, json: topupInfo } = await requestJsonWithRetry(page.request, 'get', `${baseURL}/api/user/topup/info`, {
  headers: { 'New-Api-User': userId },
});
if (!topupInfo.success) {
  throw new Error(`Top-up info failed: ${topupInfo.message || topupInfoResponse.status()}`);
}

const { response: payResponse, json: payJson } = await requestJsonWithRetry(page.request, 'post', `${baseURL}/api/user/pay`, {
  headers: { 'New-Api-User': userId },
  data: { amount: 1, payment_method: 'alipay' },
  maxAttempts: 6,
  retryBaseMs: 10000,
});
if (!payJson || payJson.message !== 'success') {
  throw new Error(`Payment creation failed: ${redact(JSON.stringify(payJson))}`);
}

const data = payJson.data || {};
const assertions = {
  payStatus: payResponse.status(),
  payUrl: payJson.url,
  type: data.type,
  hasPid: Boolean(data.pid),
  hasSign: Boolean(data.sign),
  notifyUrl: data.notify_url,
  returnUrl: data.return_url,
  alipayOnly: Array.isArray(topupInfo.data?.pay_methods)
    && topupInfo.data.pay_methods.length === 1
    && topupInfo.data.pay_methods[0].type === 'alipay',
  onlineTopupEnabled: topupInfo.data?.enable_online_topup === true,
  noStripe: topupInfo.data?.enable_stripe_topup === false,
  noWaffo: topupInfo.data?.enable_waffo_topup === false && topupInfo.data?.enable_waffo_pancake_topup === false,
};

const failures = [];
if (assertions.payUrl !== 'https://zpayz.cn/submit.php') failures.push(`Unexpected pay URL: ${assertions.payUrl}`);
if (assertions.type !== 'alipay') failures.push(`Unexpected payment type: ${assertions.type}`);
if (!assertions.hasPid || !assertions.hasSign) failures.push('Missing ZPay PID or signature');
if (assertions.notifyUrl !== `${baseURL}/api/user/epay/notify`) failures.push(`Unexpected notify URL: ${assertions.notifyUrl}`);
if (assertions.returnUrl !== `${baseURL}/console/log`) failures.push(`Unexpected return URL: ${assertions.returnUrl}`);
if (!assertions.alipayOnly) failures.push(`Pay methods are not Alipay-only: ${JSON.stringify(topupInfo.data?.pay_methods)}`);
if (!assertions.onlineTopupEnabled) failures.push('Online top-up is not enabled');
if (!assertions.noStripe || !assertions.noWaffo) failures.push('A non-Alipay online payment channel is enabled');

await page.goto(`${baseURL}/console/topup`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
const text = await page.locator('body').innerText();
await page.screenshot({ path: 'output/playwright/matrix-payment-topup.png', fullPage: false });

const pageAssertions = {
  redirectedToLightweightPage: page.url().startsWith(`${baseURL}/wallet`),
  hasAlipay: text.includes('Alipay'),
  hasWechatCheckout: /WeChat cashier|ZPay\s*WeChat/.test(text),
  hasStripe: text.includes('Stripe'),
  hasCorrectAmount: /Quantity\s*100\s*->\s*10\s*CNY|Actual payment\s*10\s*CNY/i.test(text),
};
if (!pageAssertions.redirectedToLightweightPage) failures.push(`Recharge route did not redirect to lightweight top-up page: ${page.url()}`);
if (!pageAssertions.hasAlipay) failures.push('Recharge page does not show Alipay');
if (pageAssertions.hasWechatCheckout) failures.push('Recharge page still contains WeChat checkout wording');
if (pageAssertions.hasStripe) failures.push('Recharge page shows Stripe');
if (!pageAssertions.hasCorrectAmount) failures.push('Recharge page does not show 100 quantity = 10 CNY');

await browser.close();

const report = {
  topup: {
    enable_online_topup: topupInfo.data?.enable_online_topup,
    pay_methods: topupInfo.data?.pay_methods,
  },
  payment: {
    ...assertions,
    hasPid: assertions.hasPid,
    hasSign: assertions.hasSign,
  },
  page: pageAssertions,
  consoleErrors: [...new Set(errors)].slice(0, 20),
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(redact(JSON.stringify(report, null, 2)));
