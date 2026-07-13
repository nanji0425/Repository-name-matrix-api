import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const host = '47.82.105.81';
const keyPath = process.env.SSH_KEY_PATH || 'C:\\Users\\Administrator\\Downloads\\server_key_restrict.pem';
const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

function readSecret(name) {
  const command = `cd /root/token_API && sed -n 's/^${name}=//p' .env`;
  return execFileSync('ssh', [
    '-i',
    keyPath,
    '-o',
    'StrictHostKeyChecking=no',
    `root@${host}`,
    command,
  ], { encoding: 'utf8' }).trim();
}

function sample(text, length = 700) {
  return text.replace(/\s+/g, ' ').slice(0, length);
}

mkdirSync('output/playwright', { recursive: true });

const username = readSecret('NEW_API_ADMIN_USERNAME');
const password = readSecret('NEW_API_ADMIN_PASSWORD');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1050 },
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
const loginJson = await loginResponse.json();
if (!loginJson.success) throw new Error(`Login failed: ${loginJson.message || loginResponse.status()}`);

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
  localStorage.setItem('locale', 'zh');
  localStorage.setItem('theme-mode', 'dark');
}, { userId, userData });

const report = { token: {}, topup: {}, pages: [], errors: [] };

async function gotoAppRoute(route, waitMs = 3000) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction((currentRoute) => {
    const text = document.body?.innerText || '';
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 180;
    if (loadingOnly || text.length < 120) return false;
    if (currentRoute.includes('/console/channel')) return /Channel|渠道|Admin Center|MatrixAPI Admin Center/i.test(text);
    if (currentRoute.includes('/console/deployment')) return /MatrixAPI Routing|Channel management|Model management/i.test(text);
    if (currentRoute.includes('/console/models')) return /MatrixAPI Models|Model gallery|模型/i.test(text);
    if (currentRoute.includes('/console/token')) return /Token|令牌|Import config/i.test(text);
    if (currentRoute.includes('/console/setting')) return /Settings|系统设置|Website settings/i.test(text);
    return /MatrixAPI|Admin Center/i.test(text);
  }, route, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function safeScreenshot(path) {
  try {
    await page.screenshot({ path, fullPage: false, timeout: 8000 });
  } catch (error) {
    report.errors.push(`screenshot skipped: ${error.message}`);
  }
}

await gotoAppRoute('/console/token', 4000);
let text = await page.locator('body').innerText();
report.token.initial = {
  url: page.url(),
  hasAdd: text.includes('添加令牌'),
  hasCopySelected: text.includes('复制所选令牌'),
  hasDeleteSelected: text.includes('删除所选令牌'),
  hasModelColumn: text.includes('可用模型'),
  hasIpColumn: text.includes('IP限制'),
  sample: sample(text),
};
await safeScreenshot('output/playwright/matrix-token-page-before-dialog.png');

const addButton = page.getByText('添加令牌', { exact: true }).first();
if (await addButton.count()) {
  await addButton.click();
  await page.waitForTimeout(1200);
}

text = await page.locator('body').innerText();
const dialogBox = await page.locator('[role="dialog"], .semi-modal-content, .semi-drawer-content').first().boundingBox().catch(() => null);
report.token.dialog = {
  opened: Boolean(dialogBox),
  dialogBox,
  hasName: text.includes('名称'),
  hasQuota: text.includes('额度') || text.includes('无限额度'),
  hasModelLimit: text.includes('模型') || text.includes('可用模型'),
  hasGroup: text.includes('分组'),
  hasExpiry: text.includes('过期') || text.includes('时间'),
  hasIp: text.includes('IP'),
  hasSubmit: text.includes('提交') || text.includes('保存') || text.includes('确认') || text.includes('创建'),
  sample: sample(text, 1100),
};

const selectLike = page.locator('.semi-select, [role="combobox"]').first();
if (await selectLike.count()) {
  await selectLike.click().catch(() => {});
  await page.waitForTimeout(800);
}

report.token.dropdowns = await page.locator('.semi-select-option-list,.semi-dropdown,.semi-popover,.semi-portal').evaluateAll((elements) => elements.map((element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    text: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 120),
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    overflow: style.overflow,
    zIndex: style.zIndex,
    visible: rect.width > 0 && rect.height > 0,
  };
})).catch((error) => [{ error: error.message }]);
await safeScreenshot('output/playwright/matrix-token-dialog-dropdown.png');

await gotoAppRoute('/console/topup', 4000);
text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
report.topup = {
  url: page.url(),
  redirectedToLightweightPage: page.url().startsWith(`${baseURL}/wallet`),
  hasAlipay: text.includes('Alipay'),
  hasWechat: text.includes('WeChat'),
  hasStripe: text.includes('Stripe'),
  hasZpayWechat: text.includes('ZPay WeChat') || text.includes('WeChat cashier'),
  hasAmount: /Quantity\s*100\s*->\s*100\s*CNY|Actual payment\s*100\s*CNY/i.test(text),
  sample: sample(text, 900),
};
await safeScreenshot('output/playwright/matrix-topup-page-deep.png');

for (const route of ['/console', '/console/token', '/console/models', '/console/channel', '/console/deployment', '/console/setting', '/console/personal', '/keys', '/wallet', '/models/metadata', '/channels', '/system-settings/site', '/profile']) {
  await gotoAppRoute(route, 2500);
  text = await page.locator('body').innerText().catch(() => '');
  report.pages.push({
    route,
    url: page.url(),
    isLogin: page.url().includes('/login'),
    hasMatrix: text.includes('MatrixAPI'),
    hasNotFound: /页面未找到|Page Not Found|404/.test(text),
    sample: sample(text, 420),
  });
}

report.errors = [...new Set(errors)].slice(0, 40);
await browser.close();

console.log(JSON.stringify(report, null, 2));
