import { request } from 'node:https';
import { request as httpRequest } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';

const baseURL = (process.env.MATRIXAPI_URL || 'https://matrixapi.online').replace(/\/$/, '');
const httpURL = process.env.MATRIXAPI_HTTP_URL || baseURL.replace(/^https:/, 'http:');

const publicPaths = ['/', '/docs', '/wallet', '/pricing', '/user-agreement', '/privacy-policy'];
const staticPaths = ['/matrix-assets/matrixapi-logo.png', '/matrix-assets/matrix-console.css'];
const sensitivePaths = [
  '/.env',
  '/.git/config',
  '/docker-compose.yml',
  '/docker-compose.legacy.yml',
  '/PROJECT_FULL_CONTEXT_REDACTED.txt',
  '/PROJECT_HANDOFF.md',
  '/AGENTS.md',
  '/ruvector.db',
  '/售后qq群二维码.jpg',
  '/nginx/nginx.conf',
  '/scripts/qa-helpers.mjs',
];

function fetchRaw(url, options = {}) {
  const client = url.startsWith('https:') ? request : httpRequest;
  return new Promise((resolve, reject) => {
    const req = client(url, {
      method: options.method || 'GET',
      timeout: options.timeout || 15000,
      rejectUnauthorized: false,
      headers: {
        'user-agent': 'MatrixAPI-QA/production-security',
        ...(options.headers || {}),
      },
    }, (res) => {
      const chunks = [];
      let received = 0;
      const maxBytes = options.maxBytes || 160000;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (received <= maxBytes) {
          chunks.push(chunk);
          return;
        }
        const allowed = Math.max(0, maxBytes - (received - chunk.length));
        if (allowed > 0) chunks.push(chunk.subarray(0, allowed));
      });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchWithRetry(url, options = {}) {
  const attempts = options.attempts || 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchRaw(url, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }
  throw lastError;
}

function headerValue(headers, name) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

function hasSecretLikeContent(text) {
  return /(DB_PASSWORD|REDIS_PASSWORD|SESSION_SECRET|CRYPTO_SECRET|UPSTREAM_API_KEY|ZPAY_KEY|BEGIN (RSA |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9_]+)/i.test(text || '');
}

function isBlocked(response) {
  return [301, 302, 307, 308, 401, 403, 404].includes(Number(response.status));
}

mkdirSync('output/security', { recursive: true });

const report = {
  baseURL,
  checkedAt: new Date().toISOString(),
  public: [],
  static: [],
  sensitive: [],
  http: null,
};

for (const path of publicPaths) {
  const response = await fetchWithRetry(`${baseURL}${path}`);
  report.public.push({
    path,
    status: response.status,
    headers: {
      strictTransportSecurity: headerValue(response.headers, 'strict-transport-security'),
      xFrameOptions: headerValue(response.headers, 'x-frame-options'),
      xContentTypeOptions: headerValue(response.headers, 'x-content-type-options'),
      referrerPolicy: headerValue(response.headers, 'referrer-policy'),
      permissionsPolicy: headerValue(response.headers, 'permissions-policy'),
      contentSecurityPolicy: headerValue(response.headers, 'content-security-policy'),
      setCookie: headerValue(response.headers, 'set-cookie'),
      server: headerValue(response.headers, 'server'),
    },
    bodyLength: response.body.length,
  });
}

for (const path of staticPaths) {
  const response = await fetchWithRetry(`${baseURL}${path}`, { maxBytes: 64000 });
  report.static.push({
    path,
    status: response.status,
    contentType: headerValue(response.headers, 'content-type'),
    cacheControl: headerValue(response.headers, 'cache-control'),
    setCookie: headerValue(response.headers, 'set-cookie'),
    xContentTypeOptions: headerValue(response.headers, 'x-content-type-options'),
  });
}

for (const path of sensitivePaths) {
  const response = await fetchWithRetry(`${baseURL}${path}`, { maxBytes: 64000 });
  report.sensitive.push({
    path,
    status: response.status,
    contentType: headerValue(response.headers, 'content-type'),
    bodyLength: response.body.length,
    blocked: isBlocked(response),
    hasSecretLikeContent: hasSecretLikeContent(response.body),
    textSample: response.body.replace(/\s+/g, ' ').slice(0, 160),
  });
}

const httpResponse = await fetchWithRetry(`${httpURL}/docs`, { maxBytes: 64000 });
report.http = {
  url: `${httpURL}/docs`,
  status: httpResponse.status,
  location: headerValue(httpResponse.headers, 'location'),
  strictTransportSecurity: headerValue(httpResponse.headers, 'strict-transport-security'),
};

const failures = [];
for (const item of report.public) {
  if (item.status !== 200) failures.push(`${item.path}: expected 200, got ${item.status}`);
  if (!/max-age=\d+/i.test(item.headers.strictTransportSecurity)) failures.push(`${item.path}: missing HSTS`);
  if (!/^SAMEORIGIN$/i.test(item.headers.xFrameOptions)) failures.push(`${item.path}: missing X-Frame-Options SAMEORIGIN`);
  if (!/^nosniff$/i.test(item.headers.xContentTypeOptions)) failures.push(`${item.path}: missing X-Content-Type-Options nosniff`);
  if (!item.headers.referrerPolicy) failures.push(`${item.path}: missing Referrer-Policy`);
  if (!item.headers.permissionsPolicy) failures.push(`${item.path}: missing Permissions-Policy`);
  if (!item.headers.contentSecurityPolicy) failures.push(`${item.path}: missing Content-Security-Policy`);
  if (item.headers.setCookie) failures.push(`${item.path}: public static page set cookie`);
}

for (const item of report.static) {
  if (item.status !== 200) failures.push(`${item.path}: expected static 200, got ${item.status}`);
  if (item.setCookie) failures.push(`${item.path}: static asset set cookie`);
  if (!/^nosniff$/i.test(item.xContentTypeOptions)) failures.push(`${item.path}: static asset missing nosniff`);
}

for (const item of report.sensitive) {
  if (!item.blocked) failures.push(`${item.path}: sensitive path returned ${item.status}`);
  if (item.hasSecretLikeContent) failures.push(`${item.path}: sensitive content marker exposed`);
}

if (!String(report.http.location || '').startsWith('https://')) {
  failures.push(`HTTP /docs does not redirect to HTTPS: ${report.http.status} ${report.http.location}`);
}

const output = { ...report, failures };
writeFileSync('output/security/qa-production-security-report.json', JSON.stringify(output, null, 2));

if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
