import { chromium } from 'playwright';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const expectedRoutePaths = [
  '/channels',
  '/models/metadata',
  '/models/deployments',
  '/users',
  '/redemption-codes',
  '/subscriptions',
  '/system-settings/site',
];

const routes = [
  {
    path: '/channels',
    name: 'channel management',
    mustMatch: [
      /Channels|渠道/i,
      /Create Channel|创建渠道/i,
      /Priority|优先级/i,
    ],
  },
  {
    path: '/models/metadata',
    name: 'model metadata',
    mustMatch: [
      /Metadata|元信息/i,
      /Add Model|添加模型/i,
      /Model Name|模型名称/i,
      /Vendor|供应商/i,
    ],
  },
  {
    path: '/models/deployments',
    name: 'model deployments',
    mustMatch: [
      /Deployments|部署/i,
      /Create deployment|创建部署/i,
      /Model deployment service is disabled|Provider|Status|提供商|状态/i,
    ],
  },
  {
    path: '/users',
    name: 'user management',
    mustMatch: [
      /Users|用户/i,
      /Add User|添加用户/i,
      /Username|用户名/i,
      /Role|角色/i,
    ],
  },
  {
    path: '/redemption-codes',
    name: 'redemption codes',
    mustMatch: [
      /Redemption Codes|兑换码/i,
      /Create Code|创建代码/i,
      /Quota|额度/i,
    ],
  },
  {
    path: '/subscriptions',
    name: 'subscription management',
    mustMatch: [
      /Subscription Management|订阅管理/i,
      /Create Plan|新建套餐/i,
      /Price|价格/i,
    ],
  },
  {
    path: '/system-settings/site',
    expectedPath: '/system-settings/site/system-info',
    name: 'system information settings',
    mustMatch: [
      /System Information|系统信息/i,
      /Frontend Theme|前端主题/i,
      /System Name|系统名称/i,
      /Server Address|服务器地址/i,
    ],
  },
];

function normalize(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizePath(pathname) {
  return String(pathname || '').replace(/\/+$/, '') || '/';
}

function validateRouteContract(routeTable) {
  const paths = routeTable.map((route) => route.path);
  const missing = expectedRoutePaths.filter((path) => !paths.includes(path));
  const unexpected = paths.filter((path) => !expectedRoutePaths.includes(path));
  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
  const incomplete = routeTable
    .filter(
      (route) =>
        !route.name ||
        !Array.isArray(route.mustMatch) ||
        route.mustMatch.length < 2,
    )
    .map((route) => route.path);
  const failures = [];

  if (missing.length) {
    failures.push(`Missing administrator routes: ${missing.join(', ')}`);
  }
  if (unexpected.length) {
    failures.push(`Unexpected administrator routes: ${unexpected.join(', ')}`);
  }
  if (duplicates.length) {
    failures.push(
      `Duplicate administrator routes: ${[...new Set(duplicates)].join(', ')}`,
    );
  }
  if (incomplete.length) {
    failures.push(
      `Incomplete administrator route assertions: ${incomplete.join(', ')}`,
    );
  }
  if (paths.some((path) => path === '/console' || path.startsWith('/console/'))) {
    failures.push(
      'Legacy /console routes are not valid administrator coverage targets',
    );
  }

  return { paths, failures };
}

const routeContract = validateRouteContract(routes);
if (routeContract.failures.length) {
  console.error(JSON.stringify({ routeContract }, null, 2));
  process.exit(1);
}

if (process.argv.includes('--contract-only')) {
  console.log(JSON.stringify({ routeContract }, null, 2));
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});

const consoleErrors = [];
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

const login = await loginAndInstallAdmin(page, {
  locale: 'en',
  theme: 'light',
});
const failures = [];
const report = {
  login: {
    id: login.userData.id,
    username: login.userData.username,
    role: login.userData.role,
    status: login.userData.status,
  },
  routes: [],
  consoleErrors: [],
  failures,
};

if (String(login.userData.username) !== 'aming') {
  failures.push(`Admin username is not aming: ${login.userData.username}`);
}
if (Number(login.userData.role) < 100) {
  failures.push(`Admin role is below 100: ${login.userData.role}`);
}
if (Number(login.userData.status) !== 1) {
  failures.push(`Admin account is not enabled: ${login.userData.status}`);
}

for (const route of routes) {
  await page.goto(`${baseURL}${route.path}`, {
    waitUntil: 'commit',
    timeout: 60000,
  });
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return text.length > 140 && !/Loading console assets/.test(text);
  }, null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3500);

  const state = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    return {
      url: location.href,
      pathname: location.pathname,
      title: document.title,
      text: text.replace(/\s+/g, ' ').trim(),
    };
  });

  const missing = route.mustMatch
    .filter((pattern) => !pattern.test(state.text))
    .map((pattern) => String(pattern));
  const actualPath = normalizePath(state.pathname);
  const expectedPath = normalizePath(route.expectedPath || route.path);

  const routeReport = {
    route: route.path,
    expectedPath,
    name: route.name,
    url: state.url,
    pathname: actualPath,
    missing,
    sample: normalize(state.text).slice(0, 900),
  };
  report.routes.push(routeReport);

  if (actualPath !== expectedPath) {
    failures.push(`${route.name} resolved to unexpected path: ${state.pathname}`);
  }
  if (actualPath === '/login' || actualPath.startsWith('/login/')) {
    failures.push(`${route.name} redirected to login`);
  }
  if (actualPath === '/403' || /Forbidden|Access Denied/i.test(state.text)) {
    failures.push(`${route.name} denied administrator access`);
  }
  if (actualPath === '/404' || /404 Not Found|Page Not Found/i.test(state.text)) {
    failures.push(`${route.name} rendered a 404`);
  }
  if (missing.length) {
    failures.push(
      `${route.name} is missing expected backend content: ${missing.join(', ')}`,
    );
  }
}

report.consoleErrors = [...new Set(consoleErrors)];
if (report.consoleErrors.length) {
  failures.push(`Console errors: ${report.consoleErrors.join(' | ')}`);
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
