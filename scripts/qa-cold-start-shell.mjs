import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const brandInit = readFileSync('nginx/site/brand-init.js', 'utf8');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (/net::ERR_(NAME_NOT_RESOLVED|CONNECTION_RESET)/.test(text)) return;
  errors.push(text);
});

await page.route('https://matrixapi.test/matrix-assets/brand-init.js', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: brandInit,
  });
});

await page.route('https://matrixapi.test/static/js/index.slow.js', async () => {
  await new Promise(() => {});
});

await page.route('https://matrixapi.test/console/deployment', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `
      <!doctype html>
      <html lang="zh">
        <head>
          <meta charset="utf-8">
          <title>New API</title>
          <script defer src="https://matrixapi.test/static/js/index.slow.js"></script>
          <script src="https://matrixapi.test/matrix-assets/brand-init.js"></script>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `,
  });
});

await page.goto('https://matrixapi.test/console/deployment', { waitUntil: 'commit' });

await page.waitForTimeout(700);

const report = await page.evaluate(() => ({
  readyState: document.readyState,
  hasShell: Boolean(document.querySelector('[data-matrix-cold-start-shell]')),
  shellText: document.querySelector('[data-matrix-cold-start-shell]')?.textContent?.replace(/\s+/g, ' ').trim() || '',
  rootTextLength: document.querySelector('#root')?.textContent?.trim().length || 0,
}));

await page.evaluate(() => {
  document.querySelector('#root').innerHTML = '<main>Console rendered</main>';
});
await page.waitForTimeout(300);

const afterRender = await page.evaluate(() => ({
  hasShell: Boolean(document.querySelector('[data-matrix-cold-start-shell]')),
  rootText: document.querySelector('#root')?.textContent?.trim() || '',
}));

await page.goto('about:blank');
await page.route('https://matrixapi.test/console/deployment-empty', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `
      <!doctype html>
      <html lang="zh">
        <head>
          <meta charset="utf-8">
          <title>New API</title>
          <script src="https://matrixapi.test/matrix-assets/brand-init.js"></script>
        </head>
        <body>
          <header></header>
          <main></main>
          <footer>MatrixAPI</footer>
        </body>
      </html>
    `,
  });
});

await page.goto('https://matrixapi.test/console/deployment-empty', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);

const deploymentGuide = await page.evaluate(() => {
  const guide = document.querySelector('[data-matrix-deployment-guide]');
  return {
    hasGuide: Boolean(guide),
    hasChannelLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/channel'),
    hasModelLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/models'),
    hasTokenLink: [...document.querySelectorAll('[data-matrix-deployment-guide] a')].some((link) => link.getAttribute('href') === '/console/token'),
    text: guide?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) || '',
  };
});

await page.route('https://matrixapi.test/console/models-empty', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `
      <!doctype html>
      <html lang="zh">
        <head>
          <meta charset="utf-8">
          <title>New API</title>
          <script src="https://matrixapi.test/matrix-assets/brand-init.js"></script>
        </head>
        <body>
          <main></main>
        </body>
      </html>
    `,
  });
});

await page.goto('https://matrixapi.test/console/models-empty', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);

const modelsGuide = await page.evaluate(() => {
  const guide = document.querySelector('[data-matrix-models-guide]');
  return {
    hasGuide: Boolean(guide),
    hasPricingLink: [...document.querySelectorAll('[data-matrix-models-guide] a')].some((link) => link.getAttribute('href') === '/pricing'),
    hasChannelLink: [...document.querySelectorAll('[data-matrix-models-guide] a')].some((link) => link.getAttribute('href') === '/console/channel'),
    text: guide?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) || '',
  };
});

await browser.close();

const failures = [];
if (!report.hasShell) failures.push('Cold-start shell is missing while deferred app bundle is still loading');
if (!/MatrixAPI/.test(report.shellText)) failures.push('Cold-start shell does not identify MatrixAPI');
if (report.rootTextLength !== 0) failures.push('Test fixture root should stay empty before the app bundle loads');
if (afterRender.hasShell) failures.push('Cold-start shell was not removed after the app rendered root content');
if (!deploymentGuide.hasGuide) failures.push('Deployment guide is missing on an empty deployment page');
if (!deploymentGuide.hasChannelLink || !deploymentGuide.hasModelLink || !deploymentGuide.hasTokenLink) failures.push('Deployment guide links are incomplete on an empty deployment page');
if (!modelsGuide.hasGuide) failures.push('Models guide is missing on an empty models page');
if (!modelsGuide.hasPricingLink || !modelsGuide.hasChannelLink) failures.push('Models guide links are incomplete on an empty models page');
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report, afterRender, deploymentGuide, modelsGuide, consoleErrors: [...new Set(errors)] }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ report, afterRender, deploymentGuide, modelsGuide, consoleErrors: [...new Set(errors)] }, null, 2));
