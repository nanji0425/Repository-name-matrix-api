import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});

const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await loginAndInstallAdmin(page);

await page.goto(`${baseURL}/console/token`, { waitUntil: 'commit', timeout: 45000 });
await page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {});
await page.waitForTimeout(6000);
await page.screenshot({ path: 'output/playwright/token-import-before.png', fullPage: false });

const before = await page.evaluate(() => ({
  hasToolbarImport: document.body.innerText.includes('Import config'),
  hasRowImport: [...document.querySelectorAll('button')].some((button) => (button.innerText || '').trim() === 'Import'),
  hasEmptyState: /未找到 API 密钥|No API keys found/i.test(document.body.innerText),
  textSample: document.body.innerText.replace(/\s+/g, ' ').slice(0, 900),
}));

await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((button) => (button.innerText || '').trim() === 'Import config')
    ?.click();
});
await page.waitForTimeout(1000);
await page.screenshot({ path: 'output/playwright/token-import-modal.png', fullPage: false });

const modal = await page.evaluate(() => {
  const overlay = document.querySelector('[data-matrix-import-modal]');
  const overlayBox = overlay?.getBoundingClientRect();
  const cards = [...document.querySelectorAll('.matrix-import-card')].map((card) => ({
    text: card.innerText.replace(/\s+/g, ' '),
    href: card.getAttribute('href'),
  }));
  return {
    exists: Boolean(overlay),
    overlayBox: overlayBox && {
      x: overlayBox.x,
      y: overlayBox.y,
      width: overlayBox.width,
      height: overlayBox.height,
    },
    zIndex: overlay ? getComputedStyle(overlay).zIndex : null,
    cards,
    badHost: cards.some((card) => /api\.bblabu\.(chat|cn)/.test(card.href || '')),
  };
});

await browser.close();

const names = modal.cards.map((card) => card.text);
const required = [
  'CC Switch - Codex',
  'CC Switch - Claude',
  'CC Switch - Gemini',
  'Cherry Studio',
  'AionUI',
  'DeepChat',
  'Lobe Chat',
  'AI as Workspace',
  'AMA',
  'OpenCat',
  'Fluent Read',
];
const failures = [];

if (!before.hasToolbarImport) failures.push('Token toolbar import button is missing');
if (!before.hasRowImport && !before.hasEmptyState) failures.push('Token row import button is missing');
if (!modal.exists) failures.push('Import modal did not open');
if (modal.cards.length !== required.length) failures.push(`Unexpected import card count: ${modal.cards.length}`);
for (const name of required) {
  if (!names.some((text) => text.includes(name))) failures.push(`Missing import card: ${name}`);
}
if (modal.badHost) failures.push('Import links still reference bblabu upstream host');
if (!modal.cards.every((card) => (card.href || '').includes('matrixapi.online') || (card.href || '').includes('/docs'))) {
  failures.push('One or more import links do not reference MatrixAPI or local docs');
}
if (modal.zIndex !== '1000000') failures.push(`Import modal z-index is not high enough: ${modal.zIndex}`);
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const report = {
  before,
  modal: {
    ...modal,
    cards: modal.cards.map((card) => ({ text: card.text, hrefPrefix: (card.href || '').slice(0, 80) })),
  },
  consoleErrors: [...new Set(errors)],
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
