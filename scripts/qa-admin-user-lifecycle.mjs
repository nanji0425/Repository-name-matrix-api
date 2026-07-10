import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const labels = {
  addUser: '\u6dfb\u52a0\u7528\u6237',
  cancel: '\u53d6\u6d88',
  confirm: '\u786e\u5b9a',
  deactivate: '\u6ce8\u9500',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
  submit: '\u63d0\u4ea4',
};

let runId = process.env.QA_USER_ID || `${Date.now().toString(36).slice(-8)}${Math.random().toString(36).slice(2, 5)}`;
let username = '';
let displayName = '';
let password = '';
const remark = 'MatrixAPI temporary QA user, safe to delete';

function setIdentity(nextRunId) {
  runId = nextRunId;
  username = `qu_${runId}`;
  displayName = `QA User ${runId}`;
  password = `Qa_${runId}_Pwd9`;
}

setIdentity(runId);

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function redact(value) {
  return String(value || '')
    .replace(new RegExp(password.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[PASSWORD]')
    .replace(/[A-Za-z0-9_-]{24,}/g, '[REDACTED]');
}

async function waitForUserPage(page) {
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 160;
    return !loadingOnly && text.length > 220 && (text.includes('\u7528\u6237') || /User/i.test(text));
  }, null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1600);
}

async function gotoUserPage(page) {
  await page.goto(`${baseURL}/console/user`, { waitUntil: 'commit', timeout: 60000 });
  await waitForUserPage(page);
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

async function fillUserDialog(page) {
  const inputs = await visibleInputsInDialog(page);
  const count = await inputs.count();
  if (count < 4) throw new Error(`User dialog expected at least 4 visible inputs, found ${count}`);

  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(displayName);
  await inputs.nth(2).fill(password);
  await inputs.nth(3).fill(remark);
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
  if (!clicked) throw new Error('Could not click user submit button');
}

async function searchUser(page, name) {
  await gotoUserPage(page);
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
  if (!filled) throw new Error('Could not fill user search input');
  await clickText(page, labels.search, { exact: true }).catch(() => false);
  await page.waitForTimeout(2200);
  return findRowByUsername(page, name);
}

async function clearSearch(page) {
  await clickText(page, labels.reset, { exact: true }).catch(() => false);
  await page.waitForTimeout(900);
}

async function findRowByUsername(page, name) {
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
      return {
        text,
        buttons,
        deactivated: text.includes('\u5df2\u6ce8\u9500') || text.includes('DeletedAt') || /deactivated|deleted/i.test(text),
      };
    }
    return null;
  }, name);
}

async function clickRowMoreAction(page, name, actionText) {
  const openedMore = await page.evaluate((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = [...document.querySelectorAll('tr,.semi-table-row,[role="row"]')].find((candidate) => {
      const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim();
      return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text);
    });
    if (!row) return false;
    const action = [...row.querySelectorAll('button,a,[role="button"]')]
      .find((element) => {
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        const aria = element.getAttribute('aria-label') || '';
        return !text && /more/i.test(aria || element.outerHTML);
      });
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

async function confirmDanger(page) {
  await page.waitForTimeout(800);
  const clicked = await page.evaluate((confirmLabel) => {
    const roots = [...document.querySelectorAll('[role="dialog"],.semi-modal-content,.semi-popover,.semi-popconfirm,.semi-portal')];
    roots.push(document);
    for (const root of roots) {
      const buttons = [...root.querySelectorAll('button,[role="button"]')].filter((button) => {
        const rect = button.getBoundingClientRect();
        const text = (button.innerText || button.textContent || '').replace(/\s+/g, ' ').trim();
        return rect.width > 0 && rect.height > 0 && !button.disabled && (
          text === confirmLabel || /^Confirm$|^OK$|^Delete$|^Deactivate$/i.test(text)
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
  if (!clicked) throw new Error('Could not confirm user deletion/deactivation');
}

async function deleteUserIfPresent(page, name, cleanupLog) {
  const row = await searchUser(page, name).catch(() => null);
  if (!row) {
    cleanupLog.push({ username: name, found: false, deleted: false });
    return false;
  }
  if (row.deactivated) {
    const item = { username: name, found: true, alreadyDeactivated: true, deleted: true, rowSample: redact(row.text).slice(0, 360) };
    cleanupLog.push(item);
    return item;
  }
  await clickRowMoreAction(page, name, labels.deactivate);
  await confirmDanger(page);
  await page.waitForTimeout(2600);
  const afterDeactivate = await searchUser(page, name);
  const deleted = Boolean(afterDeactivate?.deactivated);
  const item = {
    username: name,
    found: true,
    deleted,
    rowSample: redact((afterDeactivate?.text || row.text)).slice(0, 360),
  };
  cleanupLog.push(item);
  return item;
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
  username,
  displayName,
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

  const preclean = await deleteUserIfPresent(page, username, cleanup);
  if (preclean?.alreadyDeactivated) {
    setIdentity(`${Date.now().toString(36).slice(-8)}${Math.random().toString(36).slice(2, 5)}`);
    report.runId = runId;
    report.username = username;
    report.displayName = displayName;
  }
  await clearSearch(page);

  await gotoUserPage(page);
  if (!(await clickText(page, labels.addUser))) {
    throw new Error('Add user button not found');
  }
  await page.waitForTimeout(1500);
  await fillUserDialog(page);
  await clickPrimarySubmit(page);
  await page.waitForTimeout(3200);

  const createdRow = await searchUser(page, username);
  report.created = {
    visible: Boolean(createdRow),
    rowSample: createdRow ? redact(createdRow.text).slice(0, 600) : '',
  };
  if (!createdRow) throw new Error('Created user did not appear in user list');

  await clickRowMoreAction(page, username, labels.deactivate);
  await confirmDanger(page);
  await page.waitForTimeout(3000);
  const rowAfterDelete = await searchUser(page, username);
  report.deleted = {
    absent: !rowAfterDelete,
    deactivated: Boolean(rowAfterDelete?.deactivated),
    rowSample: rowAfterDelete ? redact(rowAfterDelete.text).slice(0, 600) : '',
  };
  if (!rowAfterDelete?.deactivated) throw new Error('Temporary user did not reach deactivated/deleted state');
} catch (error) {
  failures.push(error.message);
} finally {
  try {
    await deleteUserIfPresent(page, username, cleanup);
  } catch (cleanupError) {
    cleanup.push({ error: cleanupError.message });
  }
}

const userReachedDeletedState = Boolean(report.deleted?.deactivated || report.deleted?.absent || cleanup.some((item) => item.deleted));
report.consoleErrors = [...new Set(consoleErrors)]
  .filter((error) => !/localStorage.*Access is denied/i.test(error))
  .filter((error) => !(userReachedDeletedState && /record not found/i.test(error)))
  .slice(0, 30);
if (report.consoleErrors.length) failures.push(`Console errors: ${report.consoleErrors.join(' | ')}`);

const failedWrites = responses.filter((response) => response.status >= 400);
if (failedWrites.length) failures.push(`Write API failures: ${failedWrites.map((item) => `${item.method} ${item.status} ${item.url}`).join(' | ')}`);

writeFileSync('output/playwright/qa-admin-user-lifecycle-report.json', JSON.stringify(report, null, 2));
await browser.close();

if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
