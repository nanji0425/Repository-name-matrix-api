import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const host = '47.82.105.81';
const keyPath = process.env.SSH_KEY_PATH || 'C:\\Users\\Administrator\\Downloads\\服务器密钥.pem';
const baseURL = 'https://matrixapi.online';

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

const username = readSecret('NEW_API_ADMIN_USERNAME');
const password = readSecret('NEW_API_ADMIN_PASSWORD');

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

async function snap(name) {
  await page.screenshot({ path: `output/playwright/${name}.png`, fullPage: false });
}

const loginResponse = await page.request.post(`${baseURL}/api/user/login`, {
  ignoreHTTPSErrors: true,
  data: { username, password },
});
if (!loginResponse.ok()) {
  throw new Error(`API login failed with ${loginResponse.status()}`);
}
const loginJson = await loginResponse.json();
if (!loginJson.success) {
  throw new Error(`API login failed: ${loginJson.message || 'unknown error'}`);
}
const userId = String(loginJson.data.id);
const userData = loginJson.data;

await page.route('**/api/**', async (route) => {
  const headers = {
    ...route.request().headers(),
    'New-Api-User': userId,
  };
  await route.continue({ headers });
});

await page.addInitScript(({ userId, userData }) => {
  window.localStorage.setItem('uid', userId);
  window.localStorage.setItem('user', JSON.stringify(userData));
}, { userId, userData });

const cookiesAfterLogin = await page.context().cookies(baseURL);
const selfResponse = await page.request.get(`${baseURL}/api/user/self`, {
  ignoreHTTPSErrors: true,
  headers: { 'New-Api-User': userId },
});
const selfText = await selfResponse.text();

await page.goto(`${baseURL}/console`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const afterLoginUrl = page.url();
await snap('qa-after-login');

const routes = [
  ['/console', 'console'],
  ['/console/token', 'token'],
  ['/keys', 'token-alias'],
  ['/console/topup', 'topup'],
  ['/wallet', 'wallet-alias'],
  ['/console/log', 'log'],
  ['/pricing', 'pricing'],
];

const results = [];
for (const [route, name] of routes) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(route === '/pricing' ? 8000 : 3000);
  const text = await page.locator('body').innerText();
  results.push({
    route,
    url: page.url(),
    hasLoginExpired: /未登录|登录已过期|重新登录/.test(text),
    hasWechatCheckout: /微信收银台|ZPay\s*微信/.test(text),
    hasMatrixBrand: text.includes('MatrixAPI'),
    hasNotFound: /页面未找到|Page Not Found|404/.test(text),
    textSample: text.replace(/\s+/g, ' ').slice(0, 260),
  });
  await snap(`qa-${name}`);
}

await browser.close();

console.log(JSON.stringify({
  afterLoginUrl,
  cookiesAfterLogin: cookiesAfterLogin.map((cookie) => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  })),
  selfStatus: selfResponse.status(),
  selfTextSample: selfText.replace(/"session":"[^"]+"/g, '"session":"[REDACTED]"').slice(0, 500),
  routes: results,
  consoleErrors: [...new Set(errors)].slice(0, 20),
}, null, 2));
