import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const siteRoot = join(process.cwd(), 'nginx', 'site');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function resolveAsset(url) {
  const { pathname } = new URL(url, 'http://127.0.0.1');
  if (pathname === '/wallet' || pathname === '/wallet/' || pathname === '/wallet.html' || pathname === '/topup' || pathname === '/topup/' || pathname === '/topup.html') return join(siteRoot, 'wallet.html');
  if (pathname === '/user-agreement' || pathname === '/privacy-policy') return join(siteRoot, 'legal.html');
  if (pathname === '/sign-up' || pathname === '/sign-up/') return join(siteRoot, 'sign-up.html');
  if (pathname.startsWith('/matrix-assets/')) return join(siteRoot, pathname.replace('/matrix-assets/', ''));
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const filePath = resolveAsset(req.url || '/');
    if (!filePath) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const baseURL = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];

try {
  await page.route('**/api/user/login', async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1001,
          username: body.username || 'qa-user',
          role: 1,
        },
      }),
    });
  });

  await page.goto(`${baseURL}/wallet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  const initial = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const text = document.body.innerText.replace(/\s+/g, ' ');
    return {
      title: document.title,
      text,
      hasStaticBundle: /\/static\/js\//.test(html),
      hasMatrixLogo: html.includes('/matrix-assets/matrixapi-logo.png'),
      hasAuthGate: Boolean(document.querySelector('.auth-gate-card')),
      hasAmountInput: Boolean(document.querySelector('input[name="amount"]')),
      submitText: document.querySelector('button[type="submit"]')?.textContent || '',
      links: [...document.querySelectorAll('a[href]')].map((link) => link.getAttribute('href') || ''),
    };
  });

  if (initial.title !== 'MatrixAPI Wallet') failures.push(`Unexpected title: ${initial.title}`);
  if (initial.hasStaticBundle) failures.push('Static wallet gate must not load SPA /static/js bundles');
  if (!initial.hasMatrixLogo) failures.push('Wallet gate is missing MatrixAPI logo');
  if (!initial.hasAuthGate) failures.push('Wallet should show the unauthenticated login gate');
  if (initial.hasAmountInput) failures.push('Wallet should not show public top-up amount controls before sign-in');
  if (!initial.text.includes('支付宝充值')) failures.push('Wallet gate should mention Alipay top-up');
  if (/WeChat|Stripe|USDT|微信/i.test(initial.text)) failures.push('Wallet gate shows unsupported payment wording');
  if (!initial.links.includes('/sign-up')) failures.push('Wallet gate should link to register');
  if (!initial.links.includes('/user-agreement') || !initial.links.includes('/privacy-policy')) failures.push('Wallet gate should link legal pages');
  if (!/登录并进入钱包/.test(initial.submitText)) failures.push(`Unexpected wallet submit button: ${initial.submitText}`);

  await page.locator('input[name="username"]').fill('qa-user');
  await page.locator('input[name="password"]').fill('qa-password');
  await page.locator('input[name="agree"]').check();
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(500);

  const afterSubmit = await page.evaluate(() => ({
    statusText: document.querySelector('[data-status]')?.textContent || '',
    href: location.pathname,
  }));

  if (!afterSubmit.statusText.includes('登录成功') && afterSubmit.href !== '/console/topup') {
    failures.push(`Wallet login action did not produce success state: ${JSON.stringify(afterSubmit)}`);
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));
