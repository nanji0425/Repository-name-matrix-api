import { execFileSync } from 'node:child_process';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';
const host = process.env.MATRIXAPI_HOST || '47.82.105.81';
const keyPath = process.env.SSH_KEY_PATH || 'C:\\Users\\Administrator\\Downloads\\server_key_restrict.pem';
const remoteRoot = process.env.MATRIXAPI_REMOTE_ROOT || '/root/token_API';

function fetchText(url) {
  const client = url.startsWith('https:') ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = client(url, { rejectUnauthorized: false, timeout: 30000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if ((res.statusCode || 0) >= 400) {
          reject(new Error(`GET ${url} returned ${res.statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`GET ${url} timed out`));
    });
    req.on('error', reject);
    req.end();
  });
}

function shQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function ssh(command) {
  return execFileSync('ssh', [
    '-i',
    keyPath,
    '-o',
    'StrictHostKeyChecking=no',
    `root@${host}`,
    command,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
}

const html = await fetchText(`${baseURL}/console`);
const assets = [...new Set([...html.matchAll(/\/static\/(?:js|css)\/[^"')\s]+/g)].map((match) => match[0]))];

if (!assets.length) {
  throw new Error('No console static assets found in /console HTML');
}

const commands = [
  `cd ${shQuote(remoteRoot)}`,
  'mkdir -p nginx/site/static/js nginx/site/static/css',
  ...assets.map((asset) => {
    const target = `nginx/site${asset}`;
    return `docker exec matrixapi-nginx curl -fsS ${shQuote(`http://new-api:3000${asset}`)} > ${shQuote(target)}`;
  }),
  `gzip -kf -9 ${assets.map((asset) => shQuote(`nginx/site${asset}`)).join(' ')}`,
  `ls -lh ${[...new Set(assets.map((asset) => `nginx/site/static/${asset.split('/')[2]}`))].map(shQuote).join(' ')}`,
];

const output = ssh(commands.join(' && '));

console.log(JSON.stringify({
  refreshed: assets,
  output,
}, null, 2));
