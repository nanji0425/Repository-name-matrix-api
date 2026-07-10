import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const baseURL = (process.env.MATRIXAPI_URL || process.argv[2] || 'https://matrixapi.online').replace(/\/$/, '');
const route = process.env.MATRIXAPI_WARM_ROUTE || '/console';
const maxAttempts = Number(process.env.MATRIXAPI_WARM_ATTEMPTS || 3);
const timeoutMs = Number(process.env.MATRIXAPI_WARM_TIMEOUT_MS || 45000);
const totalTimeoutMs = Number(process.env.MATRIXAPI_WARM_TOTAL_TIMEOUT_MS || 90000);
const concurrency = Number(process.env.MATRIXAPI_WARM_CONCURRENCY || 4);
const startedAt = Date.now();

function remainingMs() {
  return Math.max(1, totalTimeoutMs - (Date.now() - startedAt));
}

function fetchText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? httpsRequest : httpRequest;
    const acceptEncoding = options.acceptEncoding || 'identity';
    let req;
    const totalTimer = setTimeout(() => {
      req?.destroy(new Error(`Total timeout after ${totalTimeoutMs}ms: ${url}`));
    }, remainingMs());
    req = client(url, {
      headers: {
        'accept': '*/*',
        'accept-encoding': acceptEncoding,
        'user-agent': 'MatrixAPI-Asset-Warmer/1.0',
      },
      rejectUnauthorized: false,
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        clearTimeout(totalTimer);
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body,
          text: body.toString('utf8'),
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms: ${url}`));
    });
    req.on('error', (error) => {
      clearTimeout(totalTimer);
      reject(error);
    });
    req.end();
  });
}

function absoluteUrl(href) {
  return href.startsWith('http') ? href : `${baseURL}${href}`;
}

function extractAssets(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/static/') || href.startsWith('/matrix-assets/'))
    .map(absoluteUrl);
}

async function fetchWithRetry(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (remainingMs() <= 1000) {
      return { url, error: `Skipped after global timeout budget was exhausted` };
    }
    try {
      const response = await fetchText(url, { acceptEncoding: 'gzip, br' });
      if (response.status >= 200 && response.status < 400 && response.body.length > 0) {
        return {
          url,
          status: response.status,
          bytes: response.body.length,
          cache: response.headers['x-matrix-cache'] || '',
          attempt,
        };
      }
      lastError = new Error(`HTTP ${response.status} with ${response.body.length} bytes`);
    } catch (error) {
      lastError = error;
    }
  }
  return { url, error: String(lastError) };
}

const htmlUrl = `${baseURL}${route}`;
const htmlResponse = await fetchText(htmlUrl);
if (htmlResponse.status >= 400) {
  console.error(JSON.stringify({ htmlUrl, status: htmlResponse.status }, null, 2));
  process.exit(1);
}

const assets = [...new Set(extractAssets(htmlResponse.text))];
const results = [];
let cursor = 0;
async function worker() {
  for (;;) {
    if (remainingMs() <= 1000) return;
    const index = cursor;
    cursor += 1;
    if (index >= assets.length) return;
    results[index] = await fetchWithRetry(assets[index]);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, assets.length) }, worker));

if (results.some((item) => item.error)) {
  if (remainingMs() > 2200) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  for (let index = 0; index < results.length; index += 1) {
    if (remainingMs() <= 1000) break;
    if (!results[index].error) continue;
    results[index] = await fetchWithRetry(assets[index]);
  }
}

for (let index = 0; index < assets.length; index += 1) {
  results[index] ||= { url: assets[index], error: 'Skipped because global timeout expired' };
}

const failures = results.filter((item) => item.error || item.status >= 400 || item.bytes <= 0);
const output = {
  baseURL,
  route,
  htmlStatus: htmlResponse.status,
  htmlBytes: htmlResponse.body.length,
  durationMs: Date.now() - startedAt,
  totalTimeoutMs,
  assetCount: assets.length,
  results,
  failures,
};

if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
