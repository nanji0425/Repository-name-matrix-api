import { readFileSync } from 'node:fs';

const files = [
  'nginx/site/index.html',
  'nginx/site/docs.html',
  'nginx/site/wallet.html',
  'nginx/site/pricing.html',
  'nginx/site/legal.html',
  'nginx/site/matrix-console.css',
  'nginx/site/brand-init.js',
];

const failures = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const cleaned = text
    .replace(/border-radius:\s*999px/g, '')
    .replace(/border-radius:\s*50%/g, '')
    .replace(/border-radius:\s*14px/g, '')
    .replace(/border-radius:\s*12px/g, '');

  if (/radial-gradient\(circle/i.test(text)) {
    failures.push(`${file}: decorative radial circle gradients are not allowed in the MatrixAPI visual system`);
  }

  const largeRadii = [...cleaned.matchAll(/border-radius:\s*(1[6-9]|[2-9][0-9])px/g)]
    .map((match) => match[0]);
  if (largeRadii.length) {
    failures.push(`${file}: oversized framed-surface radius found (${[...new Set(largeRadii)].join(', ')})`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ checked: files }, null, 2));
