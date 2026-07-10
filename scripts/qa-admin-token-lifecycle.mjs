import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin, sleep } from './qa-helpers.mjs';

const labels = {
  addToken: '\u6dfb\u52a0\u4ee4\u724c',
  edit: '\u7f16\u8f91',
  delete: '\u5220\u9664',
  confirm: '\u786e\u5b9a',
  submit: '\u63d0\u4ea4',
  name: '\u540d\u79f0',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
};

const runId = process.env.QA_LIFECYCLE_ID || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const initialName = `qa_lifecycle_${runId}`;
const editedName = `${initialName}_edited`;

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function redact(value) {
  return String(value || '').replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-[REDACTED]');
}

async function waitForTokenPage(page) {
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    const loadingOnly = /Loading console assets/.test(text) && text.trim().length < 160;
    return !loadingOnly && text.length > 220 && (text.includes('\u4ee4\u724c') || /Token/i.test(text));
  }, null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function gotoTokenPage(page) {
  await page.goto(`${baseURL}/console/token`, { waitUntil: 'commit', timeout: 60000 });
  await waitForTokenPage(page);
}

async function bodyText(page) {
  return page.locator('body').innerText().then(compact);
}

async function clickText(page, text, options = {}) {
  const exact = options.exact ?? true;
  const timeout = options.timeout || 10000;
  const locator = page.getByText(text, { exact }).first();
  if (!(await locator.count())) return false;
  await locator.click({ timeout });
  return true;
}

async function fillVisibleInputNearLabel(page, label, value) {
  const scopedInputs = page.locator('[role="dialog"] input:visible, .semi-modal-content input:visible, .semi-drawer-content input:visible');
  const count = await scopedInputs.count();
  for (let index = 0; index < count; index += 1) {
    const input = scopedInputs.nth(index);
    const inputType = await input.getAttribute('type').catch(() => '');
    if (inputType === 'checkbox' || inputType === 'hidden') continue;
    const disabled = await input.isDisabled().catch(() => true);
    if (disabled) continue;
    await input.fill(value);
    return;
  }

  const filled = await page.evaluate(({ label, value }) => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const candidates = [...document.querySelectorAll('label,.semi-form-field,.semi-form-field-label,.semi-modal-content,.semi-drawer-content')]
      .filter((element) => (element.innerText || element.textContent || '').includes(label));
    for (const container of candidates) {
      const input = [...container.querySelectorAll('input,textarea')]
        .find((element) => isVisible(element) && !element.disabled && element.type !== 'hidden');
      if (!input) continue;
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    const visibleInputs = [...document.querySelectorAll('[role="dialog"] input,.semi-modal-content input,.semi-drawer-content input')]
      .filter((element) => isVisible(element) && !element.disabled && element.type !== 'hidden');
    const input = visibleInputs[0];
    if (!input) return false;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, { label, value });
  if (!filled) throw new Error(`Could not fill input for label ${label}`);
}

async function findRowByName(page, name) {
  return page.evaluate((name) => {
    const rows = [...document.querySelectorAll('tr,.semi-table-row,[role="row"]')];
    for (const row of rows) {
      const text = (row.innerText || row.textContent || '').replace(/\s+/g, ' ').trim();
      const firstCell = row.querySelector('td,.semi-table-row-cell,[role="cell"]');
      const firstCellText = (firstCell?.innerText || firstCell?.textContent || '').replace(/\s+/g, ' ').trim();
      if (firstCellText !== name && !new RegExp(`(^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(text)) continue;
      const buttons = [...row.querySelectorAll('button,a,[role="button"]')].map((element, index) => ({
        index,
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
      }));
      return { text, buttons };
    }
    return null;
  }, name);
}

async function clickRowAction(page, name, actionText) {
  const clicked = await page.evaluate(({ name, actionText }) => {
    const rows = [...document.querySelectorAll('tr,.semi-table-row,[role="row"]')];
    const row = rows.find((candidate) => {
      const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim();
      const firstCell = candidate.querySelector('td,.semi-table-row-cell,[role="cell"]');
      const firstCellText = (firstCell?.innerText || firstCell?.textContent || '').replace(/\s+/g, ' ').trim();
      return firstCellText === name || new RegExp(`(^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(text);
    });
    if (!row) return false;
    const action = [...row.querySelectorAll('button,a,[role="button"]')]
      .find((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim() === actionText);
    if (!action) return false;
    action.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, { name, actionText });
  if (!clicked) throw new Error(`Could not click ${actionText} for ${name}`);
}

async function clickPrimarySubmit(page) {
  const clicked = await page.evaluate((labels) => {
    const dialog = document.querySelector('[role="dialog"],.semi-modal-content,.semi-drawer-content') || document;
    const buttons = [...dialog.querySelectorAll('button,[role="button"]')].filter((button) => {
      const rect = button.getBoundingClientRect();
      const text = (button.innerText || button.textContent || '').replace(/\s+/g, ' ').trim();
      return rect.width > 0 && rect.height > 0 && !button.disabled && (
        text === labels.submit || /^Submit$|^Create$|^Save$|^Update$/i.test(text)
      );
    });
    const button = buttons[buttons.length - 1] || buttons[0];
    if (!button) return false;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, labels);
  if (!clicked) throw new Error('Could not click submit/save button');
}

async function searchToken(page, name) {
  await gotoTokenPage(page);
  await page.evaluate((value) => {
    const inputs = [...document.querySelectorAll('input')]
      .filter((input) => {
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !input.disabled && input.type !== 'hidden';
      });
    const input = inputs[0];
    if (!input) return false;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, name);
  await clickText(page, labels.search, { exact: true }).catch(() => false);
  await page.waitForTimeout(1800);
  return findRowByName(page, name);
}

async function clearSearch(page) {
  await clickText(page, labels.reset, { exact: true }).catch(() => false);
  await page.waitForTimeout(900);
}

async function confirmDelete(page) {
  await page.waitForTimeout(700);
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
  if (!clicked) throw new Error('Could not confirm delete');
}

async function deleteTokenIfPresent(page, name, cleanupLog) {
  const row = await searchToken(page, name).catch(() => null);
  if (!row) {
    cleanupLog.push({ name, found: false, deleted: false });
    return false;
  }
  await clickRowAction(page, name, labels.delete);
  await confirmDelete(page);
  await page.waitForTimeout(2200);
  const stillThere = await searchToken(page, name);
  cleanupLog.push({ name, found: true, deleted: !stillThere });
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
    url: response.url().replace(/[?&](key|token|session|sign|password)=[^&]+/gi, '$1=[REDACTED]'),
  });
});

const report = {
  baseURL,
  runId,
  initialName,
  editedName,
  login: null,
  created: null,
  edited: null,
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

  await deleteTokenIfPresent(page, initialName, cleanup);
  await deleteTokenIfPresent(page, editedName, cleanup);
  await clearSearch(page);

  await gotoTokenPage(page);
  if (!(await clickText(page, labels.addToken))) {
    throw new Error('Add token button not found');
  }
  await page.waitForTimeout(1400);
  await fillVisibleInputNearLabel(page, labels.name, initialName);
  await clickPrimarySubmit(page);
  await page.waitForTimeout(2600);

  const createdRow = await searchToken(page, initialName);
  report.created = {
    visible: Boolean(createdRow),
    rowSample: createdRow ? redact(createdRow.text).slice(0, 500) : '',
  };
  if (!createdRow) throw new Error('Created token did not appear in token list');

  await clickRowAction(page, initialName, labels.edit);
  await page.waitForTimeout(1400);
  await fillVisibleInputNearLabel(page, labels.name, editedName);
  await clickPrimarySubmit(page);
  await page.waitForTimeout(2600);

  const editedRow = await searchToken(page, editedName);
  const oldRowAfterEdit = await searchToken(page, initialName);
  report.edited = {
    visible: Boolean(editedRow),
    oldNameStillVisible: Boolean(oldRowAfterEdit),
    rowSample: editedRow ? redact(editedRow.text).slice(0, 500) : '',
  };
  if (!editedRow) throw new Error('Edited token did not appear in token list');
  if (oldRowAfterEdit) failures.push('Old token name still visible after edit');

  await clickRowAction(page, editedName, labels.delete);
  await confirmDelete(page);
  await page.waitForTimeout(2600);
  const rowAfterDelete = await searchToken(page, editedName);
  report.deleted = {
    absent: !rowAfterDelete,
    rowSample: rowAfterDelete ? redact(rowAfterDelete.text).slice(0, 500) : '',
  };
  if (rowAfterDelete) throw new Error('Edited token still visible after delete');
} catch (error) {
  failures.push(error.message);
} finally {
  try {
    await deleteTokenIfPresent(page, initialName, cleanup);
    await deleteTokenIfPresent(page, editedName, cleanup);
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

writeFileSync('output/playwright/qa-admin-token-lifecycle-report.json', JSON.stringify(report, null, 2));
await browser.close();

if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
