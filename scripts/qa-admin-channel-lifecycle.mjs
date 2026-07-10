import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const labels = {
  addChannel: '\u6dfb\u52a0\u6e20\u9053',
  confirm: '\u786e\u5b9a',
  delete: '\u5220\u9664',
  fill: '\u586b\u5165',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
  submit: '\u63d0\u4ea4',
};

const runId = process.env.QA_CHANNEL_ID || `${Date.now().toString(36).slice(-8)}${Math.random().toString(36).slice(2, 5)}`;
const channelName = `qc_${runId}`;
const modelName = `qa-noop-${runId}`;
const placeholderKey = 'sk-qa-placeholder-not-real';
const baseEndpoint = 'http://127.0.0.1:9';

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function redact(value) {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[REDACTED]')
    .replace(/[A-Za-z0-9_-]{28,}/g, '[REDACTED]');
}

async function waitForChannelPage(page) {
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 160;
    return !loadingOnly && text.length > 220 && (text.includes('\u6e20\u9053') || /Channel/i.test(text));
  }, null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1600);
}

async function gotoChannelPage(page) {
  await page.goto(`${baseURL}/console/channel`, { waitUntil: 'commit', timeout: 60000 });
  await waitForChannelPage(page);
}

async function clickText(page, text, options = {}) {
  const exact = options.exact ?? true;
  const timeout = options.timeout || 10000;
  const locator = page.getByText(text, { exact }).first();
  if (!(await locator.count())) return false;
  await locator.click({ timeout });
  return true;
}

async function visibleInputsInDialog(page) {
  return page.locator('[role="dialog"] input:visible, .semi-modal-content input:visible, .semi-drawer-content input:visible');
}

async function fillChannelDialog(page) {
  const inputs = await visibleInputsInDialog(page);
  const count = await inputs.count();
  if (count < 6) throw new Error(`Channel dialog expected at least 6 visible inputs, found ${count}`);

  await inputs.nth(0).fill(channelName);
  await inputs.nth(1).fill(placeholderKey);
  await inputs.nth(4).fill(baseEndpoint);
  await inputs.nth(5).fill(modelName);

  const fillButtons = page.getByText(labels.fill, { exact: true });
  const fillCount = await fillButtons.count();
  if (fillCount > 0) {
    await fillButtons.nth(fillCount - 1).click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
}

async function clickPrimarySubmit(page) {
  const clicked = await page.evaluate((labels) => {
    const root = document.querySelector('[role="dialog"],.semi-modal-content,.semi-drawer-content') || document;
    const buttons = [...root.querySelectorAll('button,[role="button"]')].filter((button) => {
      const rect = button.getBoundingClientRect();
      const text = (button.innerText || button.textContent || '').replace(/\s+/g, ' ').trim();
      return rect.width > 0 && rect.height > 0 && !button.disabled && (
        text === labels.submit || /^Submit$|^Create$|^Save$|^OK$/i.test(text)
      );
    });
    const button = buttons[buttons.length - 1] || buttons[0];
    if (!button) return false;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, labels);
  if (!clicked) throw new Error('Could not click channel submit button');
}

async function findRowByName(page, name) {
  return page.evaluate((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rows = [...document.querySelectorAll('tr,.semi-table-row,[role="row"]')];
    for (const row of rows) {
      const text = (row.innerText || row.textContent || '').replace(/\s+/g, ' ').trim();
      if (!new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text)) continue;
      const buttons = [...row.querySelectorAll('button,a,[role="button"]')].map((element, index) => ({
        index,
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
        aria: element.getAttribute('aria-label') || '',
      }));
      return { text, buttons };
    }
    return null;
  }, name);
}

async function searchChannel(page, name) {
  await gotoChannelPage(page);
  const filled = await page.evaluate((value) => {
    const inputs = [...document.querySelectorAll('input')].filter((input) => {
      const rect = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && !input.disabled && input.type !== 'hidden';
    });
    const input = inputs[0];
    if (!input) return false;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, name);
  if (!filled) throw new Error('Could not fill channel search input');
  await clickText(page, labels.search, { exact: true }).catch(() => false);
  await page.waitForTimeout(2200);
  return findRowByName(page, name);
}

async function clearSearch(page) {
  await clickText(page, labels.reset, { exact: true }).catch(() => false);
  await page.waitForTimeout(900);
}

async function clickRowMoreAction(page, name, actionText) {
  const openedMore = await page.evaluate((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = [...document.querySelectorAll('tr,.semi-table-row,[role="row"]')].find((candidate) => {
      const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim();
      return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text);
    });
    if (!row) return false;
    const actions = [...row.querySelectorAll('button,a,[role="button"]')]
      .filter((element) => {
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        const aria = element.getAttribute('aria-label') || '';
        return !text && /more/i.test(aria || element.outerHTML);
      });
    const action = actions[actions.length - 1] || actions[0];
    if (!action) return false;
    action.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, name);
  if (!openedMore) throw new Error(`Could not open more actions for ${name}`);

  await page.waitForTimeout(800);
  const clickedMenuItem = await page.evaluate((actionText) => {
    const menuItems = [...document.querySelectorAll('.semi-dropdown [role="menuitem"],.semi-dropdown-menu [role="menuitem"],[role="menu"] [role="menuitem"]')];
    const action = menuItems.find((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim() === actionText);
    if (!action) return false;
    action.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, actionText);
  if (!clickedMenuItem) throw new Error(`Could not click ${actionText} menu item for ${name}`);
}

async function confirmDelete(page) {
  await page.waitForTimeout(800);
  const clicked = await page.evaluate((confirmLabel) => {
    const roots = [...document.querySelectorAll('[role="dialog"],.semi-modal-content,.semi-popover,.semi-popconfirm,.semi-portal')];
    roots.push(document);
    for (const root of roots) {
      const buttons = [...root.querySelectorAll('button,[role="button"]')].filter((button) => {
        const rect = button.getBoundingClientRect();
        const text = (button.innerText || button.textContent || '').replace(/\s+/g, ' ').trim();
        return rect.width > 0 && rect.height > 0 && !button.disabled && (
          text === confirmLabel || /^Confirm$|^OK$|^Delete$/i.test(text)
        );
      });
      const button = buttons[buttons.length - 1] || buttons[0];
      if (button) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
        return true;
      }
    }
    return false;
  }, labels.confirm);
  if (!clicked) throw new Error('Could not confirm channel delete');
}

async function deleteChannelIfPresent(page, name, cleanupLog) {
  const row = await searchChannel(page, name).catch(() => null);
  if (!row) {
    cleanupLog.push({ name, found: false, deleted: false });
    return false;
  }
  await clickRowMoreAction(page, name, labels.delete);
  await confirmDelete(page);
  await page.waitForTimeout(2600);
  const stillThere = await searchChannel(page, name);
  cleanupLog.push({ name, found: true, deleted: !stillThere, rowSample: redact(row.text).slice(0, 420) });
  return !stillThere;
}

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(60000);

const consoleErrors = [];
const responses = [];
const cleanup = [];
const failures = [];

page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('response', async (response) => {
  const request = response.request();
  const method = request.method().toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return;
  if (!response.url().includes('/api/')) return;
  responses.push({
    method,
    status: response.status(),
    url: response.url().replace(/[?&](key|token|session|sign|password|code)=[^&]+/gi, '$1=[REDACTED]'),
  });
});

const report = {
  baseURL,
  runId,
  channelName,
  modelName,
  baseEndpoint,
  login: null,
  created: null,
  deleted: null,
  cleanup,
  writeResponses: responses,
  consoleErrors: [],
  failures,
};

try {
  const login = await loginAndInstallAdmin(page, { locale: 'en', theme: 'light' });
  report.login = {
    username: login.userData.username,
    role: login.userData.role,
    status: login.userData.status,
  };

  if (String(login.userData.username) !== 'aming') failures.push(`Unexpected admin username: ${login.userData.username}`);
  if (Number(login.userData.role) < 100) failures.push(`Admin role below 100: ${login.userData.role}`);

  await deleteChannelIfPresent(page, channelName, cleanup);
  await clearSearch(page);

  await gotoChannelPage(page);
  if (!(await clickText(page, labels.addChannel))) {
    throw new Error('Add channel button not found');
  }
  await page.waitForTimeout(1500);
  await fillChannelDialog(page);
  await clickPrimarySubmit(page);
  await page.waitForTimeout(3600);

  const createdRow = await searchChannel(page, channelName);
  report.created = {
    visible: Boolean(createdRow),
    rowSample: createdRow ? redact(createdRow.text).slice(0, 650) : '',
  };
  if (!createdRow) throw new Error('Created channel did not appear in channel list');
  if (!createdRow.text.includes(modelName) && !createdRow.text.includes(channelName)) {
    failures.push('Created channel row did not include expected temporary identifiers');
  }

  await clickRowMoreAction(page, channelName, labels.delete);
  await confirmDelete(page);
  await page.waitForTimeout(3000);
  const rowAfterDelete = await searchChannel(page, channelName);
  report.deleted = {
    absent: !rowAfterDelete,
    rowSample: rowAfterDelete ? redact(rowAfterDelete.text).slice(0, 650) : '',
  };
  if (rowAfterDelete) throw new Error('Temporary channel still visible after delete');
} catch (error) {
  failures.push(error.message);
} finally {
  try {
    await deleteChannelIfPresent(page, channelName, cleanup);
  } catch (cleanupError) {
    cleanup.push({ error: cleanupError.message });
  }
}

report.consoleErrors = [...new Set(consoleErrors)]
  .filter((error) => !/localStorage.*Access is denied/i.test(error))
  .slice(0, 30);
if (report.consoleErrors.length) failures.push(`Console errors: ${report.consoleErrors.join(' | ')}`);

const failedWrites = responses.filter((response) => response.status >= 400);
if (failedWrites.length) failures.push(`Write API failures: ${failedWrites.map((item) => `${item.method} ${item.status} ${item.url}`).join(' | ')}`);

writeFileSync('output/playwright/qa-admin-channel-lifecycle-report.json', JSON.stringify(report, null, 2));
await browser.close();

if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
