import { chromium } from 'playwright';
import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs';

const routes = [
  {
    path: '/console',
    name: 'admin center',
    mustMatch: [
      /MatrixAPI Admin Center/i,
      /Users/i,
      /Site status/i,
      /Channels/i,
      /Models/i,
      /Billing/i,
      /Website settings/i,
    ],
  },
  {
    path: '/console/user',
    name: 'user management',
    mustMatch: [
      /用户管理|User/i,
      /用户名|Username/i,
      /状态|Status/i,
      /角色|Role/i,
      /aming/i,
    ],
  },
  {
    path: '/console/log',
    name: 'site status and logs',
    mustMatch: [
      /使用日志|Logs|消耗额度|RPM|TPM/i,
      /时间|Time/i,
      /模型|Model/i,
      /花费|Cost/i,
    ],
  },
  {
    path: '/console/channel',
    name: 'channel management',
    mustMatch: [
      /渠道|Channel/i,
      /kukuai-upstream|OpenAI/i,
      /状态|Status/i,
      /优先级|Priority|权重|Weight/i,
    ],
  },
  {
    path: '/console/models',
    name: 'model management',
    mustMatch: [
      /MatrixAPI Models|模型管理|Model/i,
      /Model gallery|模型/i,
      /倍率|Ratio|分组|Group|计费|Pricing/i,
    ],
  },
  {
    path: '/console/redemption',
    name: 'billing tools',
    mustMatch: [
      /兑换码|Redemption/i,
      /额度|Quota|Billing/i,
      /添加兑换码|Add/i,
    ],
  },
  {
    path: '/console/setting',
    name: 'website settings',
    mustMatch: [
      /运营设置|系统设置|Settings/i,
      /文档地址|Docs|充值链接|Top-up/i,
      /额度展示类型|USD|支付设置|Payment/i,
    ],
  },
];

function normalize(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
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

const login = await loginAndInstallAdmin(page, { locale: 'en', theme: 'light' });
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
  await page.goto(`${baseURL}${route.path}`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return text.length > 140 && !/Loading console assets/.test(text);
  }, null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3500);

  const state = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    const adminLinks = [...document.querySelectorAll('[data-matrix-admin-center] a[href]')]
      .map((link) => ({
        text: link.textContent.trim().replace(/\s+/g, ' '),
        href: link.getAttribute('href') || '',
      }));
    return {
      url: location.href,
      title: document.title,
      text: text.replace(/\s+/g, ' ').trim(),
      adminLinks,
      hasAdminCenter: Boolean(document.querySelector('[data-matrix-admin-center]')),
    };
  });

  const missing = route.mustMatch
    .filter((pattern) => !pattern.test(state.text))
    .map((pattern) => String(pattern));

  const routeReport = {
    route: route.path,
    name: route.name,
    url: state.url,
    hasAdminCenter: state.hasAdminCenter,
    adminLinkCount: state.adminLinks.length,
    missing,
    sample: normalize(state.text).slice(0, 900),
  };
  report.routes.push(routeReport);

  if (state.url.includes('/login')) {
    failures.push(`${route.name} redirected to login`);
  }
  if (/404|Page Not Found|页面未找到/.test(state.text)) {
    failures.push(`${route.name} rendered a 404`);
  }
  if (!state.hasAdminCenter) {
    failures.push(`${route.name} is missing MatrixAPI admin shortcuts`);
  }
  if (state.adminLinks.length < 6) {
    failures.push(`${route.name} has too few admin management links: ${state.adminLinks.length}`);
  }
  if (state.adminLinks.some((link) => !link.href || link.href === '#')) {
    failures.push(`${route.name} contains an empty admin management link`);
  }
  if (missing.length) {
    failures.push(`${route.name} is missing expected backend content: ${missing.join(', ')}`);
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
