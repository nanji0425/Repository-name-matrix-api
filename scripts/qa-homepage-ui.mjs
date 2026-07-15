import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];

async function makePage(viewport) {
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return page;
}

const desktop = await makePage({ width: 1440, height: 1000 });
await desktop.goto(baseURL, { waitUntil: 'domcontentloaded' });
await desktop.waitForTimeout(3500);
await desktop.screenshot({ path: 'output/playwright/homepage-new-api-desktop.png', fullPage: false });

const initial = await desktop.evaluate(() => {
  const bodyText = document.body.innerText.replace(/\s+/g, ' ');
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    text: a.textContent.trim().replace(/\s+/g, ' '),
    href: a.getAttribute('href'),
    target: a.getAttribute('target') || '',
  }));

  return {
    lang: document.documentElement.lang,
    bodyClass: document.body.className,
    title: document.title,
    bodyText: bodyText.slice(0, 1200),
    hasMatrixHero: /人工智能应用基座|统一 API 网关/i.test(bodyText)
      && /海量 AI 模型|模型/i.test(bodyText),
    hasPublicPagesCopy: /核心功能/i.test(bodyText)
      && /工作流程/i.test(bodyText),
    hasEndpoint: bodyText.includes('https://matrixapi.online/v1') || bodyText.includes('/v1/chat/completions'),
    hasFooter: /©\s*2026\s*Matrix API/i.test(bodyText),
    hasDashboardEntry: links.some((link) => link.href === '/console' || link.href === '/console/' || link.href === '/dashboard' || link.href === '/dashboard/'),
    hasModelPlazaEntry: links.some((link) => link.href === '/pricing' && /model plaza|模型广场|view models/i.test(link.text)),
    hasRankingsEntry: links.some((link) => link.href === '/rankings' || link.href === '/rankings/'),
    hasLoginEntry: links.some((link) => link.href === '/sign-in' || link.href === '/sign-in/'),
    hasRegisterEntry: links.some((link) => link.href === '/sign-up' || link.href === '/sign-up/'),
    hasDocsEntry: links.some((link) => link.href === '/docs' || link.href === '/docs/'),
    hasTopupEntry: links.some((link) => link.href === '/wallet' || link.href === '/wallet/' || link.href === '/topup' || link.href === '/topup/'),
    hasQuotaPacks: /按量付费|透明计费|充值/i.test(bodyText),
    hasQuotaTopupAction: links.some((link) => (link.href === '/wallet' || link.href === '/wallet/' || link.href === '/topup' || link.href === '/topup/') && /wallet|钱包|top up|充值/i.test(link.text)),
    docsSameTab: links.filter((link) => link.href === '/docs' || link.href === '/docs/').every((link) => !link.target),
    hasAboutEntry: links.some((link) => link.href === '/about' || /about/i.test(link.text)),
    favicon: document.querySelector('link[rel~="icon"]')?.getAttribute('href') || '',
    hasMatrixLogoImage: [...document.querySelectorAll('img')].some((image) => (image.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
    linkCount: links.length,
    links,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
});

const mobile = await makePage({ width: 390, height: 844 });
await mobile.goto(baseURL, { waitUntil: 'domcontentloaded' });
await mobile.waitForTimeout(3500);
await mobile.screenshot({ path: 'output/playwright/homepage-new-api-mobile.png', fullPage: false });
const mobileReport = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 600),
}));

await browser.close();

const failures = [];
if (!initial.hasMatrixHero) failures.push('MatrixAPI homepage hero is missing');
if (!initial.hasPublicPagesCopy) failures.push('MatrixAPI homepage sections are missing');
if (!initial.hasEndpoint) failures.push('Native endpoint block is missing');
if (!initial.hasFooter) failures.push('Homepage footer is missing');
if (!initial.hasDashboardEntry) failures.push('Console entry is missing');
if (!initial.hasModelPlazaEntry) failures.push('Model Plaza entry is missing');
if (!initial.hasRankingsEntry) failures.push('Rankings entry is missing');
if (!initial.hasLoginEntry) failures.push('Login entry is missing');
if (!initial.hasDocsEntry) failures.push('Docs entry is missing');
if (!initial.docsSameTab) failures.push('Docs entry should open in the same tab');
if (initial.hasAboutEntry) failures.push('About entry should be removed from the homepage nav');
if (!initial.favicon.includes('/matrix-assets/matrixapi-favicon.png')) failures.push(`Own designed MatrixAPI favicon is missing: ${initial.favicon}`);
if (!initial.hasMatrixLogoImage) failures.push('MatrixAPI logo image is missing on homepage');
if (mobileReport.hasHorizontalOverflow) failures.push(`Mobile viewport has horizontal overflow: ${mobileReport.scrollWidth}/${mobileReport.clientWidth}`);
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const report = {
  initial,
  mobile: mobileReport,
  consoleErrors: [...new Set(errors)],
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
