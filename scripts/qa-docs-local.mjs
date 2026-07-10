import { chromium } from 'playwright';

const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const response = await page.goto(`${baseURL}/docs`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

const report = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\s+/g, ' ');
  return {
    url: location.href,
    statusTitle: document.title,
    favicon: document.querySelector('link[rel~="icon"]')?.getAttribute('href') || '',
    logo: document.querySelector('img')?.getAttribute('src') || '',
    hasOwnDesignedLogo: document.querySelector('link[rel~="icon"]')?.getAttribute('href')?.includes('/matrix-assets/matrixapi-favicon.png') &&
      document.querySelector('img')?.getAttribute('src')?.includes('/matrix-assets/matrixapi-logo.png'),
    hasReferenceStyle: Boolean(document.querySelector('.doc-layout .rail') && document.querySelector('.doc-hero')),
    hasMatrixDocs: text.includes('MatrixAPI integration docs') && text.includes('Quick start') && text.includes('Billing and top-up'),
    hasLocalEndpoint: text.includes('https://matrixapi.online/v1'),
    hasExternalDocsHost: document.documentElement.outerHTML.includes('docx.kkkliao.cn'),
    hasTopupEntry: [...document.querySelectorAll('a[href="/wallet"],a[href="/wallet/"],a[href="/topup"],a[href="/topup/"]')].length > 0,
    docsTargets: [...document.querySelectorAll('a[href="/docs"],a[href="/docs/"]')].map((link) => link.getAttribute('target') || ''),
    bodyText: text.slice(0, 900),
  };
});

await browser.close();

const failures = [];
if (!response || response.status() >= 400) failures.push(`Docs returned HTTP ${response?.status()}`);
if (!report.url.startsWith(`${baseURL}/docs`)) failures.push(`Docs navigated away: ${report.url}`);
if (!report.hasMatrixDocs) failures.push('MatrixAPI docs content is missing');
if (!report.hasLocalEndpoint) failures.push('MatrixAPI endpoint is missing from docs');
if (report.hasExternalDocsHost) failures.push('Docs still reference external docx host');
if (!report.hasTopupEntry) failures.push('Docs top-up entry is missing');
if (!report.hasOwnDesignedLogo) failures.push(`Docs does not use own designed MatrixAPI logo/favicon: ${report.favicon} / ${report.logo}`);
if (!report.hasReferenceStyle) failures.push('Docs page is missing the reference-style rail/hero layout');
if (report.docsTargets.some(Boolean)) failures.push(`Docs links should open in the same tab: ${report.docsTargets.join(',')}`);
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
