import { readFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { resolve } from 'node:path';

const metaTag = '<meta name="baidu-site-verification" content="codeva-zfLalJhUJY" />';
const fileVerificationRoute = 'location = /baidu_verify_codeva-zfLalJhUJY.html';
const baseURL = (process.env.MATRIXAPI_URL || 'https://matrixapi.online').replace(/\/$/, '');
const checkLive = process.argv.includes('--live');
const configPaths = [
  'nginx/nginx.conf',
  'nginx/conf.d/ssl.conf',
  'nginx/ssl.conf.template',
];

const failures = [];

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

function extractExactRootLocation(source) {
  return source.match(/location\s*=\s*\/\s*\{([\s\S]*?)\n\s*\}/)?.[1] || '';
}

for (const configPath of configPaths) {
  const source = await readFile(resolve(configPath), 'utf8');
  const rootLocation = extractExactRootLocation(source);
  if (!rootLocation) {
    failures.push(`${configPath}: exact homepage location not found`);
    continue;
  }
  const count = countOccurrences(rootLocation, metaTag);
  if (count !== 1) {
    failures.push(`${configPath}: expected one Baidu meta tag in homepage location, found ${count}`);
  }
  if (!rootLocation.includes(`sub_filter '</head>' '${metaTag}`)) {
    failures.push(`${configPath}: Baidu meta tag is not injected immediately before </head>`);
  }
  if (source.includes(fileVerificationRoute)) {
    failures.push(`${configPath}: obsolete file-verification location is still configured`);
  }
}

const staticHomepage = await readFile(resolve('nginx/site/index.html'), 'utf8');
const staticHead = staticHomepage.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
const staticCount = countOccurrences(staticHead, metaTag);
if (staticCount !== 1) {
  failures.push(`nginx/site/index.html: expected one Baidu meta tag in <head>, found ${staticCount}`);
}

function fetchRaw(url) {
  const client = url.startsWith('https:') ? httpsRequest : httpRequest;
  return new Promise((resolveRequest, reject) => {
    const req = client(url, {
      headers: { 'user-agent': 'MatrixAPI-QA/baidu-verification' },
      rejectUnauthorized: false,
      timeout: 15000,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolveRequest({
        status: res.statusCode || 0,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('timeout', () => req.destroy(new Error(`timeout fetching ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

const live = [];
if (checkLive) {
  try {
    const response = await fetchRaw(`${baseURL}/`);
    const head = response.body.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    const count = countOccurrences(head, metaTag);
    live.push({
      url: `${baseURL}/`,
      status: response.status,
      metaCount: count,
      contentLength: Buffer.byteLength(response.body),
    });
    if (response.status !== 200) failures.push(`${baseURL}/: expected 200, got ${response.status}`);
    if (count !== 1) failures.push(`${baseURL}/: expected one Baidu meta tag in <head>, found ${count}`);
  } catch (error) {
    failures.push(`${baseURL}/: ${error.message}`);
  }

  try {
    const httpURL = `${baseURL.replace(/^https:/, 'http:')}/`;
    const response = await fetchRaw(httpURL);
    live.push({
      url: httpURL,
      status: response.status,
      location: response.headers.location || '',
    });
    if (![301, 302, 307, 308].includes(response.status)) {
      failures.push(`${httpURL}: expected HTTPS redirect, got ${response.status}`);
    }
    if (!String(response.headers.location || '').startsWith('https://matrixapi.online/')) {
      failures.push(`${httpURL}: expected redirect to https://matrixapi.online/`);
    }
  } catch (error) {
    failures.push(`${baseURL.replace(/^https:/, 'http:')}/: ${error.message}`);
  }
}

const output = { metaTag, checkedConfigs: configPaths, live, failures };
if (failures.length) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
