import { execFileSync } from 'node:child_process';
import { request as httpsRequest } from 'node:https';
import { writeFileSync, mkdirSync } from 'node:fs';
import { host, keyPath, baseURL, redact } from './qa-helpers.mjs';

const localDocker = process.env.MATRIXAPI_LOCAL_DOCKER === '1';
const dockerBin = process.env.DOCKER_BIN || '/usr/bin/docker';
const projectDir = process.env.MATRIXAPI_PROJECT_DIR || (localDocker ? '/workspace' : '/root/token_API');
const composeProject = process.env.COMPOSE_PROJECT_NAME || 'token_api';

function ssh(command, options = {}) {
  if (localDocker) {
    return execFileSync('sh', ['-lc', command], {
      encoding: 'utf8',
      timeout: options.timeout || 30000,
      maxBuffer: options.maxBuffer || 1024 * 1024,
    }).trim();
  }

  return execFileSync('ssh', [
    '-i',
    keyPath,
    '-o',
    'StrictHostKeyChecking=no',
    `root@${host}`,
    command,
  ], {
    encoding: 'utf8',
    timeout: options.timeout || 30000,
    maxBuffer: options.maxBuffer || 1024 * 1024,
  }).trim();
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(`${baseURL}${path}`, {
      timeout: 15000,
      rejectUnauthorized: false,
      headers: { 'user-agent': 'MatrixAPI-QA/runtime' },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (_) {
          // Some endpoints may not be JSON on failure; keep a short redacted sample.
        }
        resolve({
          path,
          status: res.statusCode || 0,
          contentType: String(res.headers['content-type'] || ''),
          bodyLength: text.length,
          data: summarizeEndpoint(path, json),
          sample: redact(text.replace(/\s+/g, ' ').slice(0, 220)),
        });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timeout fetching ${path}`)));
    req.on('error', reject);
    req.end();
  });
}

function summarizeEndpoint(path, json) {
  if (!json) return null;
  if (path === '/api/status') {
    return {
      success: Boolean(json.success),
      system_name: json.data?.system_name,
      server_address: json.data?.server_address,
      docs_link: json.data?.docs_link,
      logo: json.data?.logo,
      price: json.data?.price,
      version: json.data?.version,
      setup: json.data?.setup,
    };
  }
  if (path === '/site.webmanifest') {
    return {
      name: json.name,
      short_name: json.short_name,
      start_url: json.start_url,
      display: json.display,
      iconCount: Array.isArray(json.icons) ? json.icons.length : 0,
    };
  }
  if (path === '/v1/models') {
    return {
      object: json.object,
      modelCount: Array.isArray(json.data) ? json.data.length : 0,
      errorType: json.error?.type,
      errorCode: json.error?.code,
    };
  }
  return json;
}

function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

mkdirSync('output/runtime', { recursive: true });

const expectedContainers = [
  'matrixapi-new-api',
  'matrixapi-nginx',
  'matrixapi-db',
  'matrixapi-redis',
];

const report = {
  checkedAt: new Date().toISOString(),
  host,
  containers: [],
  compose: null,
  nginx: null,
  docsFile: null,
  disk: [],
  database: null,
  redis: null,
  endpoints: [],
  failures: [],
};

const failures = report.failures;

const containerOutput = ssh(
  `${dockerBin} ps --format '{{json .}}'`,
  { timeout: 30000 },
);
const rawContainers = parseJsonLines(containerOutput || '');
report.containers = rawContainers.map((item) => ({
  name: item.Names,
  image: item.Image,
  state: item.State,
  status: item.Status,
  ports: item.Ports,
}));

for (const name of expectedContainers) {
  const container = report.containers.find((item) => item.name === name);
  if (!container) {
    failures.push(`Missing running container: ${name}`);
    continue;
  }
  if (!/^Up\b/.test(container.status || '')) {
    failures.push(`${name} is not up: ${container.status}`);
  }
  if (name !== 'matrixapi-nginx' && !/\(healthy\)/.test(container.status || '')) {
    failures.push(`${name} is missing healthy status: ${container.status}`);
  }
}

report.compose = {
  ps: ssh(localDocker
    ? `${dockerBin} compose --project-name ${composeProject} -f ${projectDir}/docker-compose.yml ps`
    : `cd ${projectDir} && ${dockerBin} compose ps`, { timeout: 30000 }),
};

const nginxCheck = ssh(`${dockerBin} exec matrixapi-nginx nginx -t 2>&1`, { timeout: 30000 });
report.nginx = { check: nginxCheck };
if (!/syntax is ok/.test(nginxCheck) || !/test is successful/.test(nginxCheck)) {
  failures.push('Nginx configuration test did not report success');
}

const diskTargets = localDocker ? '/ /workspace' : '/ /root /var/lib/docker';
const diskOutput = ssh(`df -P ${diskTargets} 2>/dev/null | awk 'NR>1 {print $6","$5","$4}'`, { timeout: 30000 });
const seenMounts = new Set();
report.disk = diskOutput
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const [mount, used, availableBlocks] = line.split(',');
    return {
      mount,
      usedPercent: Number(String(used || '').replace('%', '')),
      availableKb: Number(availableBlocks || 0),
    };
  })
  .filter((item) => {
    if (seenMounts.has(item.mount)) return false;
    seenMounts.add(item.mount);
    return true;
  });

for (const item of report.disk) {
  if (item.usedPercent >= 85) failures.push(`${item.mount} disk usage is high: ${item.usedPercent}%`);
  if (item.availableKb > 0 && item.availableKb < 1024 * 1024) {
    failures.push(`${item.mount} has less than 1GB available`);
  }
}

const dbOutput = ssh(
  `${dockerBin} exec matrixapi-db psql -U matrixapi -d new_api -Atc "select count(*) from users;"`,
  { timeout: 30000 },
);
report.database = { users: Number(dbOutput) };
if (!Number.isFinite(report.database.users) || report.database.users < 1) {
  failures.push(`Database user count is invalid: ${dbOutput}`);
}

const redisOutput = ssh(
  `cd ${projectDir} && . ./.env && ${dockerBin} exec matrixapi-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null`,
  { timeout: 30000 },
);
report.redis = { ping: redisOutput };
if (redisOutput !== 'PONG') failures.push(`Redis ping failed: ${redisOutput}`);

for (const path of ['/api/status', '/v1/models', '/robots.txt', '/site.webmanifest', '/docs', '/docs/']) {
  const endpoint = await fetchJson(path);
  report.endpoints.push(endpoint);
  if (endpoint.status >= 500 || endpoint.status === 0) {
    failures.push(`${path} returned ${endpoint.status}`);
  }
}

const statusEndpoint = report.endpoints.find((item) => item.path === '/api/status');
if (!statusEndpoint?.data?.success) failures.push('/api/status did not return success');
const docsLink = statusEndpoint?.data?.docs_link;
if (docsLink !== '/docs') {
  failures.push(`/api/status docs_link is unexpected: ${docsLink}`);
}
if (!/^\/matrix-assets\/matrixapi-logo\.png(?:\?v=\d+)?$/.test(statusEndpoint?.data?.logo || '')) {
  failures.push(`/api/status logo is not MatrixAPI asset: ${statusEndpoint?.data?.logo}`);
}

const modelsEndpoint = report.endpoints.find((item) => item.path === '/v1/models');
if (![200, 401, 403].includes(modelsEndpoint?.status)) {
  failures.push(`/v1/models returned unexpected status ${modelsEndpoint?.status}`);
}

for (const path of ['/docs', '/docs/']) {
  const endpoint = report.endpoints.find((item) => item.path === path);
  if (endpoint?.status !== 200) failures.push(`${path} returned ${endpoint?.status}`);
  if (!/text\/html/i.test(endpoint?.contentType || '')) {
    failures.push(`${path} did not return HTML content`);
  }
  if (!/id="root"|\/static\/js\/index\./i.test(endpoint?.sample || '')) {
    failures.push(`${path} did not return the SPA shell`);
  }
  if (/404|糟糕|页面未找到/i.test(endpoint?.sample || '')) {
    failures.push(`${path} returned a not-found shell`);
  }
  if (/docx\.kkkliao\.cn/i.test(endpoint?.sample || '')) {
    failures.push(`${path} still references the external documentation host`);
  }
}

writeFileSync('output/runtime/qa-production-runtime-report.json', JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
