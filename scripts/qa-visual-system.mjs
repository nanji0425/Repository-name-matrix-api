import { existsSync, readFileSync } from 'node:fs';

const files = [
  'nginx/site/index.html',
  'nginx/site/wallet.html',
  'nginx/site/pricing.html',
  'nginx/site/legal.html',
  'nginx/site/matrix-console.css',
  'nginx/site/brand-init.js',
  'output/new-api-src/web/default/src/features/docs/index.tsx',
  'output/new-api-src/web/default/src/routes/docs/index.tsx',
];

const failures = [];

if (existsSync('nginx/site/docs.html')) failures.push('old static docs.html must not exist');
if (existsSync('nginx/conf.d/docs-routes.inc')) failures.push('old docs-routes.inc must not exist');

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/docx\.kkkliao\.cn/i.test(text)) failures.push(`${file}: external docs host`);
  if (/nginx\/site\/docs\.html|docs-routes\.inc/i.test(text)) failures.push(`${file}: old static docs routing reference`);
  if (file.includes('features/docs') && /doc-layout|doc-side|doc-toc|doc-mascot/.test(text)) {
    failures.push(`${file}: old static docs layout class leaked into React docs page`);
  }
}

const docsSource = readFileSync('output/new-api-src/web/default/src/features/docs/index.tsx', 'utf8');
const docsRoute = readFileSync('output/new-api-src/web/default/src/routes/docs/index.tsx', 'utf8');

if (!docsSource.includes('PublicLayout')) failures.push('React docs page must use PublicLayout');
if (!docsRoute.includes("createFileRoute('/docs/')")) failures.push('React docs route must register /docs');

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ checked: files }, null, 2));
