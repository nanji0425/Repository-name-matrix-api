import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const routes = (process.env.QA_VISUAL_ROUTES || [
  '/',
  '/docs',
  '/wallet',
  '/pricing',
  '/user-agreement',
  '/privacy-policy',
  '/console',
  '/console/token',
  '/console/user',
  '/console/models',
  '/console/channel',
  '/console/setting',
].join(',')).split(',').map((route) => route.trim()).filter(Boolean);

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const needsConsoleSession = routes.some((route) => route.startsWith('/console') || route.startsWith('/dashboard'));

function safeName(value) {
  return value.replace(/^\//, 'home').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function waitForUsefulContent(page, route) {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const text = await page.locator('body').innerText().catch(() => '');
    const loadingOnly = /Loading (?:console|dashboard) assets/.test(text) && text.trim().length < 140;
    if (!loadingOnly && text.trim().length > (route.startsWith('/console') || route.startsWith('/dashboard') ? 220 : 480)) return;
    await page.waitForTimeout(600);
  }
}

async function inspectPage(page, route, viewportName) {
  return page.evaluate(({ route, viewportName }) => {
    const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const bodyText = compact(document.body?.innerText || '');
    const doc = document.documentElement;
    const overflowX = Math.max(0, doc.scrollWidth - doc.clientWidth);
    const logoImages = [...document.querySelectorAll('img[alt*="MatrixAPI" i], img[src*="matrixapi" i]')];
    const brokenImages = [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src);

    const textOverflow = [...document.querySelectorAll('a,button,.button,.card-link,.mini-link,.pill,.hero-pill,.nav-links a')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          text: compact(element.innerText || element.textContent || element.getAttribute('aria-label') || '').slice(0, 80),
          tag: element.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          visible: rect.width > 4 && rect.height > 4 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth,
          whiteSpace: style.whiteSpace,
        };
      })
      .filter((item) => item.visible && item.clientWidth > 0 && item.scrollWidth - item.clientWidth > 3);

    const firstViewportBlocks = [...document.querySelectorAll('header,main,section,article,aside,.hero,.card,.panel,.section,.doc-card,.matrix-admin-center')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName.toLowerCase(), className: element.className || '', top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      })
      .filter((item) => item.width > 10 && item.height > 10 && item.top < window.innerHeight && item.left < window.innerWidth);
    const adminCenter = document.querySelector('[data-matrix-admin-center]');
    const adminRect = adminCenter?.getBoundingClientRect();

    return {
      route,
      viewportName,
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      textSample: bodyText.slice(0, 320),
      overflowX,
      hasMatrixBrand: /MatrixAPI/i.test(bodyText) || logoImages.length > 0,
      logoCount: logoImages.length,
      hasConsoleBrandLogo: !(route.startsWith('/console') || route.startsWith('/dashboard')) || Boolean(document.querySelector('[data-matrix-admin-center] img[alt*="MatrixAPI" i], [data-matrix-models-guide] img[alt*="MatrixAPI" i], [data-matrix-subscription-guide] img[alt*="MatrixAPI" i], img[src*="matrixapi" i]')),
      adminCenter: adminCenter ? {
        compact: adminCenter.dataset.matrixAdminCompact === 'true',
        height: adminRect?.height || 0,
        top: adminRect?.top || 0,
        linkCount: adminCenter.querySelectorAll('a[href]').length,
      } : null,
      brokenImages,
      textOverflow: textOverflow.slice(0, 12),
      firstViewportBlocks: firstViewportBlocks.slice(0, 18),
      hasColdStartOnly: /Loading (?:console|dashboard) assets/.test(bodyText) && bodyText.length < 140,
      hasNotFound: /Page Not Found|404/i.test(bodyText),
      hasLoginExpired: /login\?expired=true/i.test(location.href) || /Login expired|登录已过期/i.test(bodyText),
    };
  }, { route, viewportName });
}

mkdirSync('output/playwright/visual', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(9000);
page.setDefaultNavigationTimeout(45000);

if (needsConsoleSession && process.env.QA_VISUAL_SKIP_LOGIN !== 'true') {
  await loginAndInstallAdmin(page, { locale: 'en', theme: 'light' });
}

const report = [];
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const route of routes) {
    console.error(`[qa-visual-responsive] ${viewport.name} ${route}`);
    await page.goto(`${baseURL}${route}`, { waitUntil: 'commit', timeout: 45000 });
    await page.waitForTimeout(route.startsWith('/console') || route.startsWith('/dashboard') ? 4200 : 1200);
    await waitForUsefulContent(page, route);
    const item = await inspectPage(page, route, viewport.name);
    const screenshot = `output/playwright/visual/${viewport.name}-${safeName(route)}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    item.screenshot = screenshot;
    report.push(item);
  }
}

await browser.close();

const failures = [];
for (const item of report) {
  if (item.hasLoginExpired) failures.push(`${item.viewportName} ${item.route}: login expired`);
  if (item.hasColdStartOnly) failures.push(`${item.viewportName} ${item.route}: cold-start loader only`);
  if (item.hasNotFound) failures.push(`${item.viewportName} ${item.route}: not found`);
  if (item.bodyLength < 160) failures.push(`${item.viewportName} ${item.route}: body too small`);
  if (item.overflowX > 6) failures.push(`${item.viewportName} ${item.route}: horizontal overflow ${item.overflowX}px`);
  if (!item.hasMatrixBrand) failures.push(`${item.viewportName} ${item.route}: missing MatrixAPI branding`);
  if (!item.hasConsoleBrandLogo) failures.push(`${item.viewportName} ${item.route}: missing console MatrixAPI logo`);
  if ((item.route === '/console' || item.route === '/dashboard') && item.adminCenter?.compact) failures.push(`${item.viewportName} ${item.route}: root console should use full admin center`);
  if ((item.route === '/console' || item.route === '/dashboard') && item.viewportName === 'mobile' && item.adminCenter?.height > 520) failures.push(`${item.viewportName} ${item.route}: root admin center too tall (${item.adminCenter.height}px)`);
  if ((item.route.startsWith('/console/') || item.route.startsWith('/dashboard/')) && item.adminCenter && !item.adminCenter.compact) failures.push(`${item.viewportName} ${item.route}: deep console route should use compact admin center`);
  if ((item.route.startsWith('/console/') || item.route.startsWith('/dashboard/')) && item.adminCenter?.height > (item.viewportName === 'mobile' ? 260 : 180)) failures.push(`${item.viewportName} ${item.route}: compact admin center too tall (${item.adminCenter.height}px)`);
  if ((item.route.startsWith('/console/') || item.route.startsWith('/dashboard/')) && item.viewportName === 'mobile' && item.adminCenter?.top > 260) failures.push(`${item.viewportName} ${item.route}: compact admin center too low (${item.adminCenter.top}px)`);
  if ((item.route.startsWith('/console') || item.route.startsWith('/dashboard')) && item.adminCenter && item.adminCenter.linkCount < 6) failures.push(`${item.viewportName} ${item.route}: admin center missing management links`);
  if (item.brokenImages.length) failures.push(`${item.viewportName} ${item.route}: broken images ${item.brokenImages.join(', ')}`);
  if (item.textOverflow.length) failures.push(`${item.viewportName} ${item.route}: text overflow ${item.textOverflow.map((x) => x.text || x.tag).join(', ')}`);
}
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const output = { report, consoleErrors: [...new Set(errors)].slice(0, 30), failures };
writeFileSync('output/playwright/visual/qa-visual-responsive-report.json', JSON.stringify(output, null, 2));

if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
