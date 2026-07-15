import { readFileSync } from 'node:fs';

const files = [
  'nginx/site/index.html',
  'nginx/site/wallet.html',
  'nginx/site/pricing.html',
  'nginx/site/rankings.html',
  'nginx/site/legal.html',
  'nginx/site/brand-init.js',
  'output/new-api-src/web/default/src/features/docs/index.tsx',
  'output/new-api-src/web/default/src/routes/docs/index.tsx',
];

const disallowedPatterns = [
  { pattern: /[\u921b\u934b\u6fbe\u5a34\u7f02\u6fb6\u74ba\u7668]/, reason: 'mojibake text' },
];

const failures = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const { pattern, reason } of disallowedPatterns) {
    if (pattern.test(text)) failures.push(`${file}: ${reason}`);
  }
}

for (const file of files.filter((item) => item.endsWith('.html'))) {
  const text = readFileSync(file, 'utf8');
  const pageChecks = [
    { pattern: /docx\.kkkliao\.cn/i, reason: 'external docs host' },
    { pattern: /bblabu/i, reason: 'old upstream reference' },
    { pattern: /target="_blank"/i, reason: 'new-tab link in MatrixAPI-owned pages' },
    { pattern: /href="\/about\/?"/i, reason: 'About navigation' },
    { pattern: /native\s+new-api/i, reason: 'user-facing upstream implementation copy' },
  ];
  if (file.endsWith('wallet.html')) {
    pageChecks.push(
      { pattern: /full console remains available at\s+\/console\/topup/i, reason: 'stale console top-up route copy' },
      { pattern: /\/console\/topup\s+for balance records/i, reason: 'stale balance-record route copy' },
    );
  }
  for (const { pattern, reason } of pageChecks) {
    if (pattern.test(text)) failures.push(`${file}: ${reason}`);
  }
}

const docsSource = readFileSync('output/new-api-src/web/default/src/features/docs/index.tsx', 'utf8');
const docsRoute = readFileSync('output/new-api-src/web/default/src/routes/docs/index.tsx', 'utf8');

for (const { pattern, reason } of [
  { pattern: /docx\.kkkliao\.cn/i, reason: 'external docs host' },
  { pattern: /bblabu/i, reason: 'old upstream reference' },
  { pattern: /native\s+new-api/i, reason: 'user-facing upstream implementation copy' },
  { pattern: /上游|渠道|加价|成本价|upstream|retail pricing|group ratio/i, reason: 'supplier/pricing internals exposed in public docs' },
]) {
  if (pattern.test(docsSource)) failures.push(`new docs source: ${reason}`);
}

if (!docsSource.includes('https://matrixapi.online/v1')) failures.push('new docs source: missing Matrix API endpoint');
if (!docsSource.includes('3315419516@qq.com')) failures.push('new docs source: missing support email');
if (!docsSource.includes('1050365180')) failures.push('new docs source: missing support QQ group');
if (!docsRoute.includes("createFileRoute('/docs/')")) failures.push('new docs route: missing /docs SPA route');

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ checked: files }, null, 2));
