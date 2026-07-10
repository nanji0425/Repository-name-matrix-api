import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const labels = {
  addToken: '\u6dfb\u52a0\u4ee4\u724c',
  addUser: '\u6dfb\u52a0\u7528\u6237',
  addChannel: '\u6dfb\u52a0\u6e20\u9053',
  addRedemption: '\u6dfb\u52a0\u5151\u6362\u7801',
  edit: '\u7f16\u8f91',
  name: '\u540d\u79f0',
  username: '\u7528\u6237\u540d',
  quota: '\u989d\u5ea6',
  group: '\u5206\u7ec4',
  model: '\u6a21\u578b',
  channel: '\u6e20\u9053',
  type: '\u7c7b\u578b',
  key: '\u5bc6\u94a5',
  status: '\u72b6\u6001',
  password: '\u5bc6\u7801',
  submit: '\u63d0\u4ea4',
  save: '\u4fdd\u5b58',
  create: '\u521b\u5efa',
};

const scenarios = [
  {
    route: '/console/token',
    name: 'token add form',
    action: [labels.addToken, 'Add token', 'Create token'],
    expectAny: [labels.name, labels.quota, labels.group, labels.model, labels.submit, labels.save, labels.create],
    minimumMatches: 3,
  },
  {
    route: '/console/token',
    name: 'token edit form',
    action: [labels.edit, 'Edit'],
    expectAny: [labels.name, labels.quota, labels.group, labels.model, labels.submit, labels.save],
    minimumMatches: 3,
  },
  {
    route: '/console/user',
    name: 'user add form',
    action: [labels.addUser, 'Add user', 'Create user'],
    expectAny: [labels.username, labels.password, labels.group, labels.quota, labels.submit, labels.save, labels.create],
    minimumMatches: 3,
  },
  {
    route: '/console/user',
    name: 'user edit form',
    action: [labels.edit, 'Edit'],
    expectAny: [labels.username, labels.group, labels.quota, labels.status, labels.submit, labels.save],
    minimumMatches: 3,
  },
  {
    route: '/console/channel',
    name: 'channel add form',
    action: [labels.addChannel, 'Add channel', 'Create channel'],
    expectAny: [labels.name, labels.type, labels.key, labels.model, labels.group, labels.submit, labels.save, labels.create],
    minimumMatches: 3,
  },
  {
    route: '/console/channel',
    name: 'channel edit form',
    action: [labels.edit, 'Edit'],
    expectAny: [labels.name, labels.type, labels.key, labels.model, labels.group, labels.submit, labels.save],
    minimumMatches: 3,
  },
  {
    route: '/console/redemption',
    name: 'redemption add form',
    action: [labels.addRedemption, 'Add redemption', 'Create redemption'],
    expectAny: [labels.name, labels.quota, labels.submit, labels.save, labels.create],
    minimumMatches: 2,
  },
  {
    route: '/console/setting',
    name: 'settings management form',
    action: [],
    expectAny: [labels.save, '\u6587\u6863\u5730\u5740', '\u5145\u503c\u94fe\u63a5', 'Docs', 'Top-up', 'Payment', 'USD'],
    minimumMatches: 3,
    inspectOnly: true,
  },
];

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function textContainsAny(text, needles) {
  return needles.filter((needle) => needle && text.includes(needle));
}

function requestLooksLikeWrite(request) {
  const method = request.method().toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
  const url = request.url();
  if (!url.includes('/api/')) return false;
  return /\/(delete|del|update|edit|status|disable|enable|save|create|add|manage|setting)\b/i.test(url);
}

async function waitForUsefulContent(page, route) {
  await page.waitForFunction((currentRoute) => {
    const text = document.body?.innerText || '';
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 160;
    if (loadingOnly || text.length < 180) return false;
    if (currentRoute.includes('/token')) return text.includes('\u4ee4\u724c') || /Token/i.test(text);
    if (currentRoute.includes('/user')) return text.includes('\u7528\u6237') || /User/i.test(text);
    if (currentRoute.includes('/channel')) return text.includes('\u6e20\u9053') || /Channel/i.test(text);
    if (currentRoute.includes('/redemption')) return text.includes('\u5151\u6362') || /Redemption/i.test(text);
    if (currentRoute.includes('/setting')) return text.includes('\u8bbe\u7f6e') || /Settings/i.test(text);
    return /MatrixAPI|Admin Center/i.test(text);
  }, route, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1800);
}

async function gotoRoute(page, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'commit', timeout: 60000 });
  await waitForUsefulContent(page, route);
}

async function bodySnapshot(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || '';
    return {
      url: location.href,
      text: text.replace(/\s+/g, ' ').trim(),
      dialogCount: document.querySelectorAll('[role="dialog"],.semi-modal-content,.semi-drawer-content').length,
      formCount: document.querySelectorAll('form,input,textarea,[role="textbox"],.semi-input,.semi-select').length,
      textHash: [...text].reduce((hash, ch) => ((hash * 33 + ch.charCodeAt(0)) >>> 0), 0),
    };
  });
}

async function clickAction(page, scenario) {
  for (const label of scenario.action) {
    const candidate = page.getByText(label, { exact: true }).first();
    if (await candidate.count()) {
      await candidate.click({ timeout: 8000 });
      return label;
    }
  }

  const controls = await page.locator('button,a,[role="button"]').evaluateAll((elements, actionLabels) => {
    const normalized = actionLabels.map((label) => String(label).toLowerCase());
    return elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        index,
        text,
        visible: rect.width > 4 && rect.height > 4 && rect.bottom > 0 && rect.right > 0,
        disabled: Boolean(element.disabled || element.getAttribute('aria-disabled') === 'true'),
        match: normalized.some((label) => text.toLowerCase().includes(label)),
      };
    }).filter((item) => item.visible && !item.disabled && item.match);
  }, scenario.action);

  if (!controls.length) return '';

  await page.locator('button,a,[role="button"]').nth(controls[0].index).click({ timeout: 8000 });
  return controls[0].text;
}

async function closeTransientUi(page, route, beforeUrl) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const closeSelectors = [
      '.semi-modal-close',
      '.semi-drawer-close',
      '[aria-label="Close"]',
      '[aria-label="close"]',
    ];
    for (const selector of closeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
        break;
      }
    }
  }).catch(() => {});
  await page.waitForTimeout(500);
  if (page.url() !== beforeUrl && !page.url().endsWith(route)) {
    await gotoRoute(page, route);
  }
}

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(45000);

const consoleErrors = [];
const writeRequests = [];
let activeScenario = '';

page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('request', (request) => {
  if (activeScenario && requestLooksLikeWrite(request)) {
    writeRequests.push({
      scenario: activeScenario,
      method: request.method(),
      url: request.url().replace(/[?&](key|token|session|sign|password)=[^&]+/gi, '$1=[REDACTED]'),
    });
  }
});

await loginAndInstallAdmin(page, { locale: 'en', theme: 'light' });

const report = [];
const failures = [];

for (const scenario of scenarios) {
  writeFileSync('output/playwright/qa-admin-operation-audit-progress.json', JSON.stringify({
    scenario: scenario.name,
    report,
  }, null, 2));

  await gotoRoute(page, scenario.route);
  const before = await bodySnapshot(page);
  activeScenario = scenario.name;
  let clicked = '';

  if (!scenario.inspectOnly) {
    clicked = await clickAction(page, scenario);
    if (!clicked) {
      activeScenario = '';
      report.push({
        name: scenario.name,
        route: scenario.route,
        clicked: '',
        opened: false,
        matched: [],
        sample: compact(before.text).slice(0, 360),
      });
      failures.push(`${scenario.name}: action control not found`);
      continue;
    }
    await page.waitForTimeout(1800);
  }

  const after = await bodySnapshot(page);
  activeScenario = '';
  const matched = textContainsAny(after.text, scenario.expectAny);
  const opened = scenario.inspectOnly || (
    after.url !== before.url
    || after.dialogCount > before.dialogCount
    || after.formCount > before.formCount
    || after.textHash !== before.textHash
  );

  const item = {
    name: scenario.name,
    route: scenario.route,
    url: after.url,
    clicked,
    opened,
    beforeDialogs: before.dialogCount,
    afterDialogs: after.dialogCount,
    beforeForms: before.formCount,
    afterForms: after.formCount,
    matched,
    sample: compact(after.text).slice(0, 700),
  };
  report.push(item);

  if (!opened) {
    failures.push(`${scenario.name}: click did not open or change a form surface`);
  }
  if (matched.length < scenario.minimumMatches) {
    failures.push(`${scenario.name}: expected management fields missing; matched ${matched.length}/${scenario.minimumMatches}`);
  }

  await closeTransientUi(page, scenario.route, before.url);
}

await browser.close();

const uniqueConsoleErrors = [...new Set(consoleErrors)]
  .filter((error) => !/localStorage.*Access is denied/i.test(error))
  .slice(0, 30);

if (uniqueConsoleErrors.length) {
  failures.push(`Console errors: ${uniqueConsoleErrors.join(' | ')}`);
}

const suspiciousWrites = writeRequests.filter((request) => !/\/api\/user\/login\b/i.test(request.url));
if (suspiciousWrites.length) {
  failures.push(`Unexpected write-like API calls during non-destructive audit: ${suspiciousWrites.map((request) => `${request.scenario} ${request.method} ${request.url}`).join(' | ')}`);
}

const output = {
  baseURL,
  scenarios: report,
  suspiciousWrites,
  consoleErrors: uniqueConsoleErrors,
  failures,
};

if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
