#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(repoRoot, 'output/new-api-src');

const requiredPaths = [
  'docker-compose.yml',
  'deploy.sh',
  '.env.production.example',
  'nginx/nginx.conf',
  'nginx/site/brand-init.js',
  'scripts/bootstrap-new-api.mjs',
  'scripts/qa-production-runtime.mjs',
  'output/new-api-src/Dockerfile',
  'output/new-api-src/go.mod',
  'output/new-api-src/go.sum',
  'output/new-api-src/web/bun.lock',
  'output/new-api-src/LICENSE',
  'output/new-api-src/NOTICE',
  'output/new-api-src/THIRD-PARTY-LICENSES.md',
];
const forbiddenPaths = [
  'backend',
  'frontend',
  'screenshots',
];
// The legacy Compose file is intentionally retained as a local rollback
// reference, but it is never part of the release archive.
const preservedLocalPaths = ['docker-compose.legacy.yml'];
const sensitivePaths = [
  'PROJECT_FULL_CONTEXT_REDACTED.txt',
  '.env.production',
];
const generatedDirectoryNames = new Set([
  'node_modules',
  '.tanstack',
  '.next',
  'dist',
  'coverage',
  '.cache',
]);

const normalizeRelativePath = (path) => path.replaceAll('\\', '/');
const missing = requiredPaths.filter((path) => {
  const fullPath = resolve(repoRoot, path);
  return !existsSync(fullPath) || !statSync(fullPath).isFile();
});
const presentForbidden = forbiddenPaths.filter((path) =>
  existsSync(resolve(repoRoot, path)),
);
const preservedLocal = preservedLocalPaths.filter((path) =>
  existsSync(resolve(repoRoot, path)),
);
const trackedSensitive = [];
const generated = [];
const trackedGenerated = [];

for (const path of sensitivePaths) {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', path], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.error) throw result.error;
  if (result.status === 0) trackedSensitive.push(path);
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr.trim() || `git ls-files failed for ${path}`);
  }
}

function inspectSourceTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.git') continue;

    const fullPath = resolve(directory, entry.name);
    if (
      generatedDirectoryNames.has(entry.name) ||
      (directory === sourceRoot && entry.name === 'output')
    ) {
      generated.push(normalizeRelativePath(relative(repoRoot, fullPath)));
      const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', relative(repoRoot, fullPath)], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      if (result.status === 0) trackedGenerated.push(normalizeRelativePath(relative(repoRoot, fullPath)));
      continue;
    }

    inspectSourceTree(fullPath);
  }
}

if (existsSync(sourceRoot)) inspectSourceTree(sourceRoot);

missing.sort();
presentForbidden.sort();
trackedSensitive.sort();
generated.sort();
trackedGenerated.sort();

assert.deepEqual(
  { missing, presentForbidden, trackedSensitive, trackedGenerated },
  { missing: [], presentForbidden: [], trackedSensitive: [], trackedGenerated: [] },
  'release source tree contract violations',
);

console.log(JSON.stringify({
  pass: true,
  required: requiredPaths.length,
  preservedLocal,
  ignoredGenerated: generated,
}));
