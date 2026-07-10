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
  if (pathname === '/pricing' || pathname === '/pricing/' || pathname === '/pricing.html') return join(siteRoot, 'pricing.html');
  if (pathname === '/wallet' || pathname === '/wallet/') return join(siteRoot, 'wallet.html');
  if (pathname === '/docs' || pathname === '/docs/') return join(siteRoot, 'docs.html');
  if (pathname.startsWith('/matrix-assets/')) return join(siteRoot, pathname.replace('/matrix-assets/', ''));
  return null;
}

let server = null;
let baseURL = process.env.MATRIXAPI_URL;

if (!baseURL) {
  server = createServer(async (req, res) => {
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
  baseURL = `http://127.0.0.1:${server.address().port}`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.route('**/api/status', async (route) => {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        announcements_enabled: false,
        announcements: [],
        system_name: 'MatrixAPI',
      },
    }),
  });
});

const response = await page.goto(`${baseURL}/pricing`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(1200);

const report = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const text = document.body.innerText.replace(/\s+/g, ' ');
  const links = [...document.querySelectorAll('a[href]')].map((link) => ({
    text: link.textContent.trim().replace(/\s+/g, ' '),
    href: link.getAttribute('href') || '',
    target: link.getAttribute('target') || '',
  }));
  return {
    url: location.href,
    title: document.title,
    textSample: text.slice(0, 1200),
    hasStaticBundle: /\/static\/js\//.test(html),
    hasMatrixLogo: [...document.querySelectorAll('img')].some((image) => (image.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
    hasModelPlaza: text.includes('模型广场') && text.includes('10 个模型'),
    hasReferenceLayout: Boolean(document.querySelector('.catalog-filter')) && document.querySelectorAll('.catalog-model').length === 10,
    hasExpectedModels: ['gpt-5.4', 'gpt-5.5', 'gpt-image2', 'claude-fable-5'].every((model) => text.includes(model)),
    hasPricing: text.includes('输入 $3.5') && text.includes('输出 $21') && text.includes('按量计费'),
    hasTopupEntry: links.some((link) => link.href === '/wallet' || link.href === '/topup'),
    hasDocsEntry: links.some((link) => link.href === '/docs' && !link.target),
    hasAboutEntry: links.some((link) => link.href === '/about' || /about/i.test(link.text)),
  };
});

await browser.close();
if (server) await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

const failures = [];
if (!response || response.status() >= 400) failures.push(`Pricing returned HTTP ${response?.status()}`);
if (!report.url.startsWith(`${baseURL}/pricing`)) failures.push(`Pricing navigated away: ${report.url}`);
if (report.hasStaticBundle) failures.push('Static pricing page should not load SPA /static/js bundles');
if (!report.hasMatrixLogo) failures.push('Pricing page is missing MatrixAPI logo');
if (!report.hasModelPlaza) failures.push('Pricing page is missing MatrixAPI model plaza heading/count');
if (!report.hasReferenceLayout) failures.push('Pricing page is missing reference-style filter rail or 10-card model grid');
if (!report.hasExpectedModels) failures.push('Pricing page is missing expected public models');
if (!report.hasPricing) failures.push('Pricing page is missing MatrixAPI model price details');
if (!report.hasTopupEntry) failures.push('Pricing page is missing top-up entry');
if (!report.hasDocsEntry) failures.push('Pricing page is missing same-tab docs entry');
if (report.hasAboutEntry) failures.push('Pricing page should not contain About navigation');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
