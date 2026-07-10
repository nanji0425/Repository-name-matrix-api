import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isDangerous(text) {
  return /Delete|Disable|Enable|Reset|Submit|Save|Confirm|Pay|Top up|Logout/i.test(text);
}

function isIgnoredControl(text) {
  return /^common\.changeLanguage$/i.test(compact(text));
}

function isTinyIcon(text, aria, title) {
  return !text && !aria && !title;
}

async function captureState(page) {
  return page.evaluate(() => ({
    url: location.href,
    locale: localStorage.getItem('locale') || localStorage.getItem('matrix-lang') || '',
    theme: localStorage.getItem('theme-mode') || localStorage.getItem('matrix-theme') || '',
    themeAttr: document.documentElement.getAttribute('theme-mode') || document.documentElement.dataset.theme || document.body?.getAttribute('theme-mode') || '',
    htmlClass: document.documentElement.className || '',
    bodyClass: document.body?.className || '',
    dialogs: document.querySelectorAll('[role="dialog"],.semi-modal,.semi-popover,.semi-dropdown,.semi-select-option-list,.matrix-import-overlay').length,
    toasts: document.querySelectorAll('.semi-toast,.semi-toast-wrapper,[data-matrix-toast]').length,
    bodyLength: document.body?.innerText?.length || 0,
    bodyHash: [...(document.body?.innerText || '')].reduce((hash, ch) => ((hash * 31 + ch.charCodeAt(0)) >>> 0), 0),
  }));
}

async function visibleControls(page) {
  return page.locator('a,button,[role="button"],.semi-tag').evaluateAll((elements) => elements
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        index,
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || '',
        text: text.slice(0, 80),
        aria: element.getAttribute('aria-label') || '',
        title: element.getAttribute('title') || '',
        href: element.getAttribute('href') || '',
        disabled: Boolean(element.disabled || element.getAttribute('aria-disabled') === 'true'),
        visible: rect.width > 4 && rect.height > 4 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth,
      };
    })
    .filter((item) => item.visible && !item.disabled));
}

async function waitForUsefulContent(page, route) {
  const expectedByRoute = {
    '/': ['MatrixAPI', 'OpenAI-compatible gateway'],
    '/docs': ['MatrixAPI integration docs', 'Quick start'],
    '/pricing': ['MatrixAPI MODEL GALLERY', 'Model prices'],
    '/topup': ['Alipay top-up', 'Recharge quantity'],
    '/wallet': ['Alipay top-up', 'Recharge quantity'],
    '/console': ['MatrixAPI Admin Center', '控制台', '聊天'],
    '/console/token': ['令牌管理', '添加令牌'],
    '/console/log': ['日志', 'Logs', 'MatrixAPI Admin Center'],
    '/console/topup': ['账户充值', '充值数量', 'Alipay top-up'],
    '/console/subscription': ['MatrixAPI Capacity Packs', 'Capacity plans'],
    '/console/personal': ['个人设置', 'Personal'],
    '/console/models': ['MatrixAPI Models', 'Model gallery'],
    '/console/channel': ['Channel', '渠道', 'MatrixAPI Admin Center'],
    '/console/redemption': ['兑换', 'Redemption', 'Billing'],
    '/console/setting': ['设置', 'Website settings', 'System'],
    '/console/deployment': ['MatrixAPI Routing', 'Channel management'],
  };
  const expected = expectedByRoute[route] || ['MatrixAPI'];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = await page.locator('body').innerText().catch(() => '');
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 140;
    const hasExpected = expected.some((needle) => text.includes(needle));
    if (!loadingOnly && text.length > 260 && (hasExpected || route.startsWith('/console/'))) return;
    if (!loadingOnly && text.length > 900) return;
    await page.waitForTimeout(500);
  }
}

async function gotoRoute(page, route) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(`${baseURL}${route}`, { waitUntil: 'commit', timeout: 45000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(2500);
    }
  }
}

async function clickByIndex(page, targetIndex) {
  return Promise.race([
    page.locator('a,button,[role="button"],.semi-tag').evaluateAll((elements, targetIndex) => {
    const element = elements.find((candidate, index) => index === targetIndex);
    if (!element) return false;
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
    }, targetIndex),
    page.waitForTimeout(2500).then(() => false),
  ]);
}

mkdirSync('output/playwright', { recursive: true });

const routes = (process.env.QA_CLICK_ROUTES || [
  '/console',
  '/console/token',
  '/console/log',
  '/topup',
  '/wallet',
  '/console/subscription',
  '/console/personal',
  '/console/models',
  '/console/channel',
  '/console/redemption',
  '/console/setting',
  '/pricing',
].join(',')).split(',').map((route) => route.trim()).filter(Boolean);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.setDefaultNavigationTimeout(30000);
const errors = [];
page.on('pageerror', (error) => {
  if (/localStorage.*Access is denied/i.test(error.message)) return;
  errors.push(error.message);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await loginAndInstallAdmin(page);

const report = [];
for (const route of routes) {
  console.error(`[qa-click-audit] ${route}`);
  writeFileSync('output/playwright/qa-click-audit-progress.json', JSON.stringify({ route, report }, null, 2));
  await gotoRoute(page, route);
  await page.waitForTimeout(route === '/pricing' || route.startsWith('/console/') ? 3800 : 1800);
  await waitForUsefulContent(page, route);
  let text = await page.locator('body').innerText().catch(() => '');
  if (/Loading console assets/.test(text) && text.trim().length < 140) {
    await page.reload({ waitUntil: 'commit', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(4200);
    await waitForUsefulContent(page, route);
  }
  text = await page.locator('body').innerText().catch(() => '');
  const controls = await visibleControls(page);
  const badLinks = controls.filter((control) => (
    control.tag === 'a'
    && (!control.href || control.href === '#')
    && control.role !== 'button'
    && control.aria !== '澶嶅埗'
    && !isDangerous(control.text)
  ));
  const unlabeled = controls.filter((control) => isTinyIcon(control.text, control.aria, control.title));

  const candidates = controls
    .filter((control) => control.tag === 'button' || (control.role === 'button' && control.tag !== 'a'))
    .filter((control) => !isDangerous(control.text))
    .filter((control) => !isIgnoredControl(control.text))
    .filter((control) => !/Previous|Next|Rows per page|All|Filter|Search|Collapse sidebar/i.test(control.text))
    .slice(0, Number(process.env.QA_CLICK_LIMIT || 3));

  const deadClicks = [];
  for (const candidate of candidates) {
    writeFileSync('output/playwright/qa-click-audit-progress.json', JSON.stringify({
      route,
      candidate: candidate.text || candidate.aria || candidate.title || '[unlabeled]',
      report,
    }, null, 2));
    const before = await captureState(page);
    const clicked = await clickByIndex(page, candidate.index);
    await page.waitForTimeout(550);
    const after = await captureState(page);
    const changed = clicked && (
      before.url !== after.url ||
      before.locale !== after.locale ||
      before.theme !== after.theme ||
      before.themeAttr !== after.themeAttr ||
      before.htmlClass !== after.htmlClass ||
      before.bodyClass !== after.bodyClass ||
      before.dialogs !== after.dialogs ||
      before.toasts !== after.toasts ||
      before.bodyHash !== after.bodyHash ||
      before.bodyLength !== after.bodyLength
    );
    if (!changed) {
      const label = candidate.text || candidate.aria || candidate.title || '[unlabeled]';
      if (isIgnoredControl(label)) continue;
      deadClicks.push({
        text: label,
        tag: candidate.tag,
        role: candidate.role,
      });
    }
    if (after.url !== before.url || after.dialogs !== before.dialogs) {
      await gotoRoute(page, route);
      await page.waitForTimeout(900);
      await waitForUsefulContent(page, route);
    }
  }

  report.push({
    route,
    url: page.url(),
    hasLoginExpired: /login\?expired=true/i.test(page.url()) || /登录已过期|Login expired/i.test(text),
    hasNotFound: /Page Not Found|404/i.test(text),
    hasLoadingOnly: /Loading console assets/.test(text) && text.trim().length < 140,
    hasEmptyBody: text.trim().length < 80,
    controlCount: controls.length,
    badLinks: badLinks.slice(0, 12),
    unlabeled: unlabeled.slice(0, 12),
    deadClicks: deadClicks.slice(0, 12),
    textSample: compact(text).slice(0, 360),
  });
}

await browser.close();

const failures = [];
for (const item of report) {
  if (item.hasLoginExpired) failures.push(`${item.route}: login expired`);
  if (item.hasNotFound) failures.push(`${item.route}: not found`);
  if (item.hasLoadingOnly) failures.push(`${item.route}: still showing cold-start loader only`);
  if (item.hasEmptyBody) failures.push(`${item.route}: empty body`);
  if (item.badLinks.length) failures.push(`${item.route}: empty/hash links ${item.badLinks.map((x) => x.text || x.aria || x.title || x.href).join(', ')}`);
  if (item.unlabeled.length) failures.push(`${item.route}: unlabeled visible clickable controls ${item.unlabeled.length}`);
}
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const output = { report, consoleErrors: [...new Set(errors)].slice(0, 30), failures };
if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
