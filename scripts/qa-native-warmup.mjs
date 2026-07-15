import { chromium } from 'playwright';

const baseURL = (process.env.MATRIXAPI_URL || 'https://matrixapi.online').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const report = [];
for (const path of ['/', '/pricing']) {
  const startedAt = Date.now();
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const ready = await page.waitForFunction((route) => {
    const root = document.querySelector('#root');
    const bodyLength = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().length;
    if (route === '/') return Boolean(root && (root.textContent || '').trim().length > 80);
    return Boolean(root && root.children.length > 0 && bodyLength > 200);
  }, path, { timeout: 15000 }).then(() => true).catch(() => false);
  const state = await page.evaluate(() => ({
    bodyLength: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().length,
    rootChildren: document.querySelector('#root')?.children.length || 0,
    rootText: (document.querySelector('#root')?.textContent || '').trim().slice(0, 120),
  }));
  report.push({ path, status: response?.status() || 0, ready, elapsedMs: Date.now() - startedAt, ...state });
}

await browser.close();
const failures = report.filter((item) => item.status !== 200 || !item.ready).map((item) => `${item.path}: content not ready (${item.status}, ${item.elapsedMs}ms)`);
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);
const output = { report, consoleErrors: [...new Set(errors)], failures };
if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));
