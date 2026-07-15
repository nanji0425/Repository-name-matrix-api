import { chromium } from 'playwright';
import { request as httpsRequest } from 'node:https';

const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

const routes = [
  '/',
  '/docs',
  '/wallet',
  '/topup',
  '/pricing',
  '/rankings',
  '/sign-in',
  '/login',
  '/forgot-password',
  '/sign-up',
  '/register',
  '/dashboard',
  '/dashboard/overview',
  '/dashboard/topup',
  '/dashboard/token',
  '/dashboard/log',
  '/dashboard/subscription',
  '/dashboard/personal',
  '/dashboard/models',
  '/dashboard/channel',
  '/dashboard/redemption',
  '/dashboard/setting',
  '/dashboard/deployment',
  '/dashboard/user',
  '/dashboard/task',
  '/user-agreement',
  '/privacy-policy',
  '/wallet',
  '/ranking',
  '/keys',
  '/models',
  '/models/metadata',
  '/channels',
  '/system-settings',
  '/profile',
];

const expectedRedirects = {
  '/topup': '/wallet',
  '/dashboard': '/dashboard/overview',
  '/dashboard/topup': '/wallet',
  '/dashboard/token': '/keys',
  '/dashboard/log': '/usage-logs/common',
  '/dashboard/subscription': '/wallet',
  '/dashboard/personal': '/profile',
  '/dashboard/models': '/models/metadata',
  '/dashboard/channel': '/channels',
  '/dashboard/redemption': '/redemption-codes',
  '/dashboard/setting': '/system-settings/site',
  '/dashboard/deployment': '/models/deployments',
  '/dashboard/user': '/users',
  '/dashboard/task': '/usage-logs/task',
  '/ranking': '/rankings',
  '/login': '/sign-in',
  '/register': '/sign-up',
};

const authAliases = new Set([
  '/dashboard',
  '/dashboard/overview',
  '/dashboard/topup',
  '/dashboard/token',
  '/dashboard/log',
  '/dashboard/subscription',
  '/dashboard/personal',
  '/dashboard/models',
  '/dashboard/channel',
  '/dashboard/redemption',
  '/dashboard/setting',
  '/dashboard/deployment',
  '/dashboard/user',
  '/dashboard/task',
  '/keys',
  '/models/metadata',
  '/channels',
  '/system-settings',
  '/profile',
  '/models',
]);

function fetchRedirect(path) {
  return new Promise((resolve) => {
    const req = httpsRequest(`${baseURL}${path}`, {
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 15000,
    }, (res) => {
      res.resume();
      resolve({
        status: res.statusCode || 0,
        location: res.headers.location || '',
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, location: 'timeout' });
    });
    req.on('error', (error) => {
      resolve({ status: 0, location: error.message });
    });
    req.end();
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1360, height: 900 } });
const page = await context.newPage();
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const report = [];

for (const route of routes) {
  const redirect = expectedRedirects[route] ? await fetchRedirect(route) : null;
  if (authAliases.has(route)) {
    report.push({ route, redirect, authAliasOnly: true });
    continue;
  }
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((error) => {
    report.push({ route, redirect, navigationError: error.message });
    return null;
  });
  if (!response) continue;
  if (route === '/') {
    await page.waitForFunction(() => {
      const root = document.querySelector('#root');
      return Boolean(root && (root.textContent || '').trim().length > 80);
    }, { timeout: 10000 }).catch(() => {});
  }
  const waitMs = route === '/pricing'
    ? 4000
    : route === '/sign-up' || route === '/register'
      ? 1200
      : route.startsWith('/console') || route.startsWith('/dashboard')
        ? 2500
        : 800;
  await page.waitForTimeout(waitMs);

  const state = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const links = [...document.querySelectorAll('a[href]')].map((link) => ({
      text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
      href: link.getAttribute('href') || '',
      target: link.getAttribute('target') || '',
    }));
    return {
      url: location.href,
      title: document.title,
      bodyLength: text.length,
      textSample: text.slice(0, 360),
      hasStaticBundle: /\/static\/js\//.test(html),
      hasExternalDocs: html.includes('docx.kkkliao.cn'),
      hasOldUpstream: html.includes('bblabu') || html.includes('bblabu-upstream'),
      hasAbout: links.some((link) => link.href === '/about' || /about/i.test(link.text)),
      badLinks: links.filter((link) => (
        (!link.href || link.href === '#')
        && !/copy/i.test(link.text)
      )).slice(0, 10),
      blankTargets: links.filter((link) => (link.href === '/docs' || link.href === '/wallet' || link.href === '/topup') && link.target).slice(0, 10),
    };
  });

  report.push({
    route,
    redirect,
    status: response.status(),
    ...state,
  });
}

await browser.close();

const failures = [];
for (const item of report) {
  if (item.navigationError) {
    failures.push(`${item.route}: navigation failed: ${item.navigationError}`);
    continue;
  }
  if (item.status >= 400) failures.push(`${item.route}: HTTP ${item.status}`);
  const minimumBodyLength = item.route === '/pricing'
    ? 200
    : ['/wallet', '/topup', '/sign-up', '/register'].includes(item.route)
      ? 30
      : 80;
  if (!item.authAliasOnly && item.bodyLength < minimumBodyLength) {
    failures.push(`${item.route}: page body too small (${item.bodyLength} < ${minimumBodyLength})`);
  }
  if (item.hasOldUpstream) failures.push(`${item.route}: references old upstream name`);
  if (item.hasExternalDocs) failures.push(`${item.route}: references external docs host`);
  if (item.hasAbout) failures.push(`${item.route}: contains About navigation`);
  if ((item.badLinks || []).length) failures.push(`${item.route}: empty/hash links ${item.badLinks.map((link) => link.text || link.href).join(', ')}`);
  if ((item.blankTargets || []).length) failures.push(`${item.route}: docs/top-up links open new tab`);

  const expected = expectedRedirects[item.route];
  if (expected) {
    const location = item.redirect?.location || '';
    const redirectedPath = location.startsWith('http') ? new URL(location).pathname : location;
    if (item.redirect?.status < 300 || item.redirect?.status >= 400 || !redirectedPath.startsWith(expected)) {
      failures.push(`${item.route}: expected first redirect to ${expected}, got ${item.redirect?.status} ${location}`);
    }
  }
}

if (errors.length) failures.push(`Console errors: ${[...new Set(errors)].join(' | ')}`);

const output = { report, consoleErrors: [...new Set(errors)], failures };
if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
