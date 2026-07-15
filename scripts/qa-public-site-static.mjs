import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const siteRoot = join(process.cwd(), 'nginx', 'site');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function resolveAsset(url) {
  if (url === '/' || url === '/index.html') return join(siteRoot, 'index.html');
  if (url === '/pricing' || url === '/pricing/' || url === '/pricing.html') return join(siteRoot, 'pricing.html');
  if (url === '/rankings' || url === '/rankings/' || url === '/rankings.html') return join(siteRoot, 'rankings.html');
  if (url === '/forgot-password' || url === '/forgot-password/') return join(siteRoot, 'forgot-password.html');
  if (url === '/sign-in' || url === '/sign-in/') return join(siteRoot, 'sign-in.html');
  if (url === '/sign-up' || url === '/sign-up/') return join(siteRoot, 'sign-up.html');
  if (url.startsWith('/matrix-assets/')) return join(siteRoot, url.replace('/matrix-assets/', ''));
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const filePath = resolveAsset(req.url || '/');
    if (!filePath) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const baseURL = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];

try {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  const home = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const navLinks = [...document.querySelectorAll('nav a[href]')].map((link) => ({
      href: link.getAttribute('href') || '',
      text: (link.textContent || '').trim(),
      target: link.getAttribute('target') || '',
    }));
    const links = [...document.querySelectorAll('a[href]')].map((link) => ({
      href: link.getAttribute('href') || '',
      text: (link.textContent || '').trim(),
      target: link.getAttribute('target') || '',
    }));
    const logo = [...document.querySelectorAll('img')].find((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png'));
    const logoStyle = logo ? getComputedStyle(logo) : null;
    return {
      title: document.title,
      hasHero: text.includes('MatrixAPI') && /OpenAI-compatible|OpenAI compatible/i.test(text),
      hasDocsEntry: navLinks.some((link) => link.href === '/docs'),
      hasConsoleEntry: navLinks.some((link) => link.href === '/console' || link.href === '/dashboard'),
      hasModelPlazaEntry: navLinks.some((link) => link.href === '/pricing' && /model plaza|模型广场/i.test(link.text)),
      hasRankingsEntry: navLinks.some((link) => link.href === '/rankings'),
      hasLoginEntry: links.some((link) => link.href === '/sign-in'),
      hasRegisterEntry: links.some((link) => link.href === '/sign-up'),
      hasQuotaPacks: /Quota packs|Starter quota|Production quota|TOP-UP PLANS|常用额度|充值数量/i.test(text),
      hasQuotaTopupAction: links.some((link) => (link.href === '/wallet' || link.href === '/topup') && /wallet|top up|quota|recharge|钱包|购买|充值|额度/i.test(link.text)),
      hasAboutEntry: navLinks.some((link) => link.href === '/about' || /about/i.test(link.text)),
      docsTargetBlank: navLinks.filter((link) => link.href === '/docs').some((link) => link.target === '_blank'),
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
      logoWidth: logoStyle ? Math.round(parseFloat(logoStyle.width)) : 0,
      logoHeight: logoStyle ? Math.round(parseFloat(logoStyle.height)) : 0,
    };
  });

  if (!home.hasHero) failures.push('Homepage is not a MatrixAPI-owned marketing page');
  if (!home.hasDocsEntry) failures.push('Homepage nav is missing the docs entry');
  if (!home.hasConsoleEntry) failures.push('Homepage nav is missing the console entry');
  if (!home.hasModelPlazaEntry) failures.push('Homepage nav is missing the model plaza entry');
  if (!home.hasRankingsEntry) failures.push('Homepage nav is missing the rankings entry');
  if (!home.hasLoginEntry) failures.push('Homepage nav is missing the login entry');
  if (!home.hasQuotaPacks) failures.push('Homepage is missing quota pack content');
  if (!home.hasQuotaTopupAction) failures.push('Homepage quota pack section is missing a top-up action');
  if (home.hasAboutEntry) failures.push('Homepage nav still contains About');
  if (home.docsTargetBlank) failures.push('Homepage docs entry still opens in a new tab');
  if (!home.hasBrandImage) failures.push('Homepage is missing the MatrixAPI logo asset');
  if (home.logoWidth !== 46 || home.logoHeight !== 46) failures.push(`Homepage logo rendered at ${home.logoWidth}x${home.logoHeight}; expected 46x46`);

  await page.goto(`${baseURL}/pricing`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const pricing = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const html = document.documentElement.outerHTML;
    const logo = [...document.querySelectorAll('img')].find((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png'));
    const logoStyle = logo ? getComputedStyle(logo) : null;
    return {
      hasStaticBundle: /\/static\/js\//.test(html),
      hasModelGallery: /MatrixAPI model gallery|模型广场/i.test(text) && text.includes('gpt-5.4') && text.includes('gpt-image2'),
      hasWalletEntry: [...document.querySelectorAll('a[href="/wallet"],a[href="/topup"]')].length > 0,
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
      logoWidth: logoStyle ? Math.round(parseFloat(logoStyle.width)) : 0,
      logoHeight: logoStyle ? Math.round(parseFloat(logoStyle.height)) : 0,
    };
  });

  if (pricing.hasStaticBundle) failures.push('Pricing page should not load SPA static bundles');
  if (!pricing.hasModelGallery) failures.push('Pricing page is missing MatrixAPI model gallery content');
  if (!pricing.hasWalletEntry) failures.push('Pricing page is missing wallet entry');
  if (!pricing.hasBrandImage) failures.push('Pricing page is missing the MatrixAPI logo asset');
  if (pricing.logoWidth !== 46 || pricing.logoHeight !== 46) failures.push(`Pricing logo rendered at ${pricing.logoWidth}x${pricing.logoHeight}; expected 46x46`);

  await page.goto(`${baseURL}/rankings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const rankings = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const navText = [...document.querySelectorAll('nav a[href]')].map((link) => link.textContent.trim()).join('|');
    const logo = [...document.querySelectorAll('img')].find((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png'));
    const logoStyle = logo ? getComputedStyle(logo) : null;
    return {
      hasRankingsContent: /排行榜|LLM 排行榜|热门模型/i.test(text) && text.includes('gpt-5.5'),
      hasReferenceNavShape: ['Home|Console|Model Plaza|Rankings|Docs', '主页|控制台|模型广场|排行榜|教程文档'].includes(navText),
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
      logoWidth: logoStyle ? Math.round(parseFloat(logoStyle.width)) : 0,
      logoHeight: logoStyle ? Math.round(parseFloat(logoStyle.height)) : 0,
    };
  });

  if (!rankings.hasRankingsContent) failures.push('Rankings page is missing MatrixAPI ranking content');
  if (!rankings.hasReferenceNavShape) failures.push('Rankings page nav does not match the reference public nav shape');
  if (!rankings.hasBrandImage) failures.push('Rankings page is missing the MatrixAPI logo asset');
  if (rankings.logoWidth !== 46 || rankings.logoHeight !== 46) failures.push(`Rankings logo rendered at ${rankings.logoWidth}x${rankings.logoHeight}; expected 46x46`);

  for (const authPath of ['/sign-in', '/sign-up']) {
    await page.goto(`${baseURL}${authPath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    const authLogo = await page.evaluate(() => {
      const logo = [...document.querySelectorAll('img')].find((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png'));
      const style = logo ? getComputedStyle(logo) : null;
      return {
        width: style ? Math.round(parseFloat(style.width)) : 0,
        height: style ? Math.round(parseFloat(style.height)) : 0,
      };
    });
    if (authLogo.width !== 38 || authLogo.height !== 38) {
      failures.push(`${authPath} logo rendered at ${authLogo.width}x${authLogo.height}; expected 38x38`);
    }
    if (authPath === '/sign-up') {
      const registration = await page.evaluate(() => ({
        hasEmail: Boolean(document.querySelector('[name="email"], [name="verificationCode"]')),
        passwordFields: document.querySelectorAll('input[name="password"], input[name="confirmPassword"]').length,
        hasUsername: Boolean(document.querySelector('input[name="username"]')),
      }));
      if (registration.hasEmail) failures.push('Static sign-up page still asks for email or verification code');
      if (!registration.hasUsername || registration.passwordFields !== 2) failures.push('Static sign-up page must contain username, password, and confirm password only');
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));
