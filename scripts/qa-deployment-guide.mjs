import { chromium } from 'playwright';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
page.setDefaultNavigationTimeout(20000);
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (/ERR_CONNECTION_CLOSED/i.test(msg.text())) return;
  if (msg.type() === 'error') errors.push(msg.text());
});

await loginAndInstallAdmin(page, { maxAttempts: 6 });
await page.goto(`${baseURL}/console/deployment`, { waitUntil: 'commit', timeout: 20000 });
for (let attempt = 0; attempt < 45; attempt += 1) {
  const ready = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    return Boolean(document.querySelector('[data-matrix-deployment-guide]'))
      || (text.length > 180 && !text.includes('Loading console assets'));
  }).catch(() => false);
  if (ready) break;
  await page.waitForTimeout(1000);
}

const report = await page.evaluate(() => {
  const text = document.body?.innerText || '';
  const guide = document.querySelector('[data-matrix-deployment-guide]');
  return {
    url: location.href,
    bodyLength: text.length,
    hasGuide: Boolean(guide),
    hasRoutingTitle: text.includes('Upstream models are connected through channel management') || text.includes('MatrixAPI Routing'),
    hasChannelLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/channel'),
    hasModelLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/models'),
    hasTokenLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/token'),
    textSample: text.replace(/\s+/g, ' ').slice(0, 900),
  };
});

await browser.close();

const failures = [];
if (report.url.includes('/login')) failures.push(`Redirected to login: ${report.url}`);
if (report.bodyLength < 80) failures.push('Deployment page body did not render');
if (!report.hasGuide) failures.push('MatrixAPI deployment guide is missing');
if (!report.hasRoutingTitle) failures.push('MatrixAPI routing title is missing');
if (/鈫|闂|鍒|娣|缂|澶|娴|璺|癨/.test(report.textSample)) failures.push('Deployment guide contains mojibake text');
if (!report.hasChannelLink || !report.hasModelLink || !report.hasTokenLink) failures.push('Deployment guide links are incomplete');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report, consoleErrors: [...new Set(errors)] }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ report, consoleErrors: [...new Set(errors)] }, null, 2));
