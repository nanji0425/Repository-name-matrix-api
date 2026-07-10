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
  if (url === '/docs' || url === '/docs/' || url === '/docs.html') return join(siteRoot, 'docs.html');
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

  await page.goto(`${baseURL}/docs`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const docs = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    return {
      hasDocsHero: text.includes('MatrixAPI integration docs') && text.includes('Quick start'),
      hasExternalDocHost: document.documentElement.outerHTML.includes('docx.kkkliao.cn'),
      sameTabDocsLinks: [...document.querySelectorAll('a[href="/docs"],a[href="/docs/"]')].every((link) => !link.getAttribute('target')),
      hasReferenceNavShape: ['Home|Console|Model Plaza|Rankings|Docs', '主页|控制台|模型广场|排行榜|文档'].includes([...document.querySelectorAll('nav a[href]')].map((link) => link.textContent.trim()).join('|')),
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
    };
  });

  if (!docs.hasDocsHero) failures.push('Docs page is missing MatrixAPI docs content');
  if (docs.hasExternalDocHost) failures.push('Docs page still references an external docs host');
  if (!docs.sameTabDocsLinks) failures.push('Docs page still contains new-tab docs links');
  if (!docs.hasReferenceNavShape) failures.push('Docs page nav does not match the reference public nav shape');
  if (!docs.hasBrandImage) failures.push('Docs page is missing the MatrixAPI logo asset');

  await page.goto(`${baseURL}/pricing`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const pricing = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const html = document.documentElement.outerHTML;
    return {
      hasStaticBundle: /\/static\/js\//.test(html),
      hasModelGallery: /MatrixAPI model gallery|模型广场/i.test(text) && text.includes('gpt-5.4') && text.includes('gpt-image2'),
      hasWalletEntry: [...document.querySelectorAll('a[href="/wallet"],a[href="/topup"]')].length > 0,
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
    };
  });

  if (pricing.hasStaticBundle) failures.push('Pricing page should not load SPA static bundles');
  if (!pricing.hasModelGallery) failures.push('Pricing page is missing MatrixAPI model gallery content');
  if (!pricing.hasWalletEntry) failures.push('Pricing page is missing wallet entry');
  if (!pricing.hasBrandImage) failures.push('Pricing page is missing the MatrixAPI logo asset');

  await page.goto(`${baseURL}/rankings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const rankings = await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    const navText = [...document.querySelectorAll('nav a[href]')].map((link) => link.textContent.trim()).join('|');
    return {
      hasRankingsContent: text.includes('Rank routes before you create production tokens.') && text.includes('gpt-5.5'),
      hasReferenceNavShape: ['Home|Console|Model Plaza|Rankings|Docs', '主页|控制台|模型广场|排行榜|文档'].includes(navText),
      hasBrandImage: [...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').includes('/matrix-assets/matrixapi-logo.png')),
    };
  });

  if (!rankings.hasRankingsContent) failures.push('Rankings page is missing MatrixAPI ranking content');
  if (!rankings.hasReferenceNavShape) failures.push('Rankings page nav does not match the reference public nav shape');
  if (!rankings.hasBrandImage) failures.push('Rankings page is missing the MatrixAPI logo asset');
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));
