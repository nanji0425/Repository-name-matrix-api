import { request } from 'node:https';
import { chromium } from 'playwright';

const baseURL = (process.env.MATRIXAPI_URL || 'https://matrixapi.online').replace(/\/$/, '');

function fetchRaw(path) {
  return new Promise((resolve, reject) => {
    const req = request(`${baseURL}${path}`, {
      timeout: 15000,
      rejectUnauthorized: false,
      headers: { 'user-agent': 'MatrixAPI-QA/launch-assets' },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timeout fetching ${path}`)));
    req.on('error', reject);
    req.end();
  });
}

function header(headers, name) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

const publicPages = ['/', '/docs', '/wallet', '/pricing', '/user-agreement', '/privacy-policy'];
const assetPaths = ['/robots.txt', '/sitemap.xml', '/site.webmanifest'];
const failures = [];
const report = {
  baseURL,
  pages: [],
  assets: [],
};

for (const path of assetPaths) {
  const response = await fetchRaw(path);
  const item = {
    path,
    status: response.status,
    contentType: header(response.headers, 'content-type'),
    cacheControl: header(response.headers, 'cache-control'),
    bodySample: response.body.replace(/\s+/g, ' ').slice(0, 240),
  };
  report.assets.push(item);

  if (response.status !== 200) failures.push(`${path}: expected HTTP 200, got ${response.status}`);
  if (!/max-age=3600/.test(item.cacheControl)) failures.push(`${path}: missing one-hour public cache header`);

  if (path === '/robots.txt') {
    if (!/User-agent:\s*\*/i.test(response.body)) failures.push('/robots.txt: missing wildcard user-agent');
    if (!/Sitemap:\s*https:\/\/matrixapi\.online\/sitemap\.xml/i.test(response.body)) {
      failures.push('/robots.txt: missing MatrixAPI sitemap URL');
    }
  }

  if (path === '/sitemap.xml') {
    const urls = [...response.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const expected = ['/', '/docs', '/pricing', '/wallet', '/user-agreement', '/privacy-policy']
      .map((route) => `https://matrixapi.online${route === '/' ? '/' : route}`);
    for (const url of expected) {
      if (!urls.includes(url)) failures.push(`/sitemap.xml: missing ${url}`);
    }
  }

  if (path === '/site.webmanifest') {
    if (!/application\/(manifest\+json|json)/i.test(item.contentType)) {
      failures.push(`/site.webmanifest: unexpected content type ${item.contentType}`);
    }
    let manifest = null;
    try {
      manifest = JSON.parse(response.body);
    } catch (error) {
      failures.push(`/site.webmanifest: invalid JSON: ${error.message}`);
    }
    if (manifest) {
      if (manifest.name !== 'MatrixAPI') failures.push('/site.webmanifest: incorrect name');
      if (manifest.start_url !== '/') failures.push('/site.webmanifest: start_url must be /');
      if (!manifest.icons?.some((icon) => icon.src === '/matrix-assets/matrixapi-logo.png')) {
        failures.push('/site.webmanifest: missing MatrixAPI icon');
      }
    }
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1360, height: 900 } });

for (const path of publicPages) {
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const state = await page.evaluate(() => ({
    title: document.title,
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href') || '',
    icon: document.querySelector('link[rel~="icon"]')?.getAttribute('href') || '',
    appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') || '',
  }));
  report.pages.push({ path, status: response?.status() || 0, ...state });

  if (!response || response.status() !== 200) failures.push(`${path}: expected HTTP 200`);
  if (state.manifest !== '/site.webmanifest') failures.push(`${path}: missing site.webmanifest link`);
  if (state.icon !== '/matrix-assets/matrixapi-favicon.png') failures.push(`${path}: missing MatrixAPI favicon`);
  if (state.appleTouchIcon !== '/matrix-assets/apple-touch-icon.png') failures.push(`${path}: missing MatrixAPI apple icon`);
}

await browser.close();

report.failures = failures;
if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
