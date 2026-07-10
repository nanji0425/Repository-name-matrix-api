import { chromium } from 'playwright';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await loginAndInstallAdmin(page);
await page.goto(`${baseURL}/console/token`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);

const report = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')].map((button) => ({
    text: button.innerText.trim().replace(/\s+/g, ' '),
    aria: button.getAttribute('aria-label') || '',
    title: button.getAttribute('title') || '',
    hidden: button.hidden || button.getAttribute('aria-hidden') === 'true' || getComputedStyle(button).display === 'none' || getComputedStyle(button).visibility === 'hidden',
    hasThemeIcon: Boolean(button.querySelector('.lucide-sun,.lucide-moon')),
    hasLangIcon: Boolean(button.querySelector('.lucide-languages,[class*="language"],[aria-label*="translate"]')),
    className: button.className,
  }));
  return {
    hasInjectedSwitchWrapper: !!document.querySelector('[data-matrix-console-switches]'),
    hasInjectedThemeSwitch: !!document.querySelector('[data-matrix-theme-switch]'),
    hasInjectedLocaleSwitch: !!document.querySelector('[data-matrix-locale-switch]'),
    hasNativeThemeButton: buttons.some((button) => button.hasThemeIcon || /切换主题|theme/i.test(button.aria)),
    hasNativeLanguageButton: buttons.some((button) => button.hasLangIcon || /common\.changeLanguage|language|语言/i.test(`${button.text} ${button.aria}`)),
    buttons: buttons.slice(0, 12),
  };
});

await browser.close();

const failures = [];
if (report.hasInjectedSwitchWrapper || report.hasInjectedThemeSwitch || report.hasInjectedLocaleSwitch) failures.push('Injected MatrixAPI capsule switches are still present');
if (!report.hasNativeThemeButton) failures.push('Native theme button is missing');
if (!report.hasNativeLanguageButton) failures.push('Native language button is missing');
if (report.buttons.some((button) => !button.hidden && /common\.changeLanguage/i.test(`${button.text} ${button.aria} ${button.title}`))) {
  failures.push('Visible native language button exposes common.changeLanguage');
}
if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
