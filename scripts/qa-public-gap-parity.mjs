import { chromium } from 'playwright';

const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (/ERR_CONNECTION_CLOSED/i.test(msg.text())) return;
  if (msg.type() === 'error') errors.push(msg.text());
});

async function inspect(route) {
  let response = null;
  let report = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500 * attempt);
    report = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const links = [...document.querySelectorAll('a[href]')].map((link) => ({
      text: link.textContent.trim().replace(/\s+/g, ' '),
      href: link.getAttribute('href') || '',
      target: link.getAttribute('target') || '',
    }));
    return {
      url: location.href,
      statusTitle: document.title,
      text,
      links,
    };
    });
    const hasLegalLinks = report.links.some((link) => link.href === '/user-agreement')
      && report.links.some((link) => link.href === '/privacy-policy');
    if (!['/sign-in', '/sign-up'].includes(route) || hasLegalLinks) break;
  }
  return { ...report, status: response?.status() || 0 };
}

const home = await inspect('/');
const login = await inspect('/sign-in');
const register = await inspect('/sign-up');

await browser.close();

const failures = [];

if (!home.links.some((link) => link.href === '/sign-up' || link.href === '/register')) failures.push('Homepage is missing a direct register entry');
if (!/quota packs|top-up packs|starter quota|production quota|enterprise quota/i.test(home.text)) {
  failures.push('Homepage is missing a quota/top-up pack section');
}
if (!home.links.some((link) => (link.href === '/wallet' || link.href === '/topup') && /wallet|top up|start|quota|recharge/i.test(link.text))) {
  failures.push('Homepage quota section is missing a wallet/top-up action');
}

for (const [name, report] of [['login', login], ['register', register]]) {
  const legalLinks = report.links.filter((link) => ['/user-agreement', '/privacy-policy'].includes(link.href));
  if (legalLinks.length < 2) failures.push(`${name}: legal links are missing`);
  for (const link of legalLinks) {
    if (link.target) failures.push(`${name}: ${link.href} should open in the same tab`);
  }
}

if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const report = {
  home: {
    url: home.url,
    title: home.statusTitle,
    textSample: home.text.slice(0, 900),
    links: home.links,
  },
  login: {
    url: login.url,
    legalLinks: login.links.filter((link) => ['/user-agreement', '/privacy-policy'].includes(link.href)),
  },
  register: {
    url: register.url,
    legalLinks: register.links.filter((link) => ['/user-agreement', '/privacy-policy'].includes(link.href)),
  },
  consoleErrors: [...new Set(errors)],
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
