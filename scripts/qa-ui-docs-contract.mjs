#!/usr/bin/env node

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const faviconHash = createHash('sha256')
  .update(readFileSync(resolve(root, 'nginx/site/matrixapi-favicon.png')))
  .digest('hex')

const brandInit = read('nginx/site/brand-init.js')
const publicShell = read('nginx/site/public-shell.css')
const docsSource = read('output/new-api-src/web/default/src/features/docs/index.tsx')
const docsRoute = read('output/new-api-src/web/default/src/routes/docs/index.tsx')
const consoleCss = read('nginx/site/matrix-console.css')
const announcementEditor = read(
  'output/new-api-src/web/default/src/features/system-settings/content/announcements-section.tsx'
)
const updateOption = read(
  'output/new-api-src/web/default/src/features/system-settings/hooks/use-update-option.ts'
)
const bootstrap = read('scripts/bootstrap-new-api-db.sh')
const compose = read('docker-compose.yml')
const docsQa = read('scripts/qa-docs-spa-route.mjs')

assert.match(docsQa, /createFileRoute\('\/docs\/'\)/, 'docs QA must inspect the SPA /docs route')
assert.match(docsQa, /PublicLayout/, 'docs QA must verify the new frontend layout')
assert.match(docsQa, /docs-routes\.inc/, 'docs QA must assert the old Nginx docs include is gone')

for (const [selector, size] of [
  ['home-brand', 46],
  ['auth-gate-brand', 38],
  ['brand', 46],
  ['matrix-app-header', 23],
  ['[data-slot="sidebar-menu-button"]', 34],
]) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(
    brandInit,
    new RegExp(`${escaped}[^\\n]*\\{width:${size}px!important;height:${size}px!important\\}`),
    `brand-init must render ${selector} at ${size}px`
  )
}

for (const [source, pattern, label] of [
  [publicShell, /\.brand img\s*\{[^}]*width:\s*46px[^}]*height:\s*46px/s, 'public navigation logo'],
  [publicShell, /\.catalog-shell\.nav \.brand img\s*\{[^}]*width:\s*46px[^}]*height:\s*46px/s, 'catalog logo'],
  [publicShell, /\.auth-gate-brand img\s*\{[^}]*width:\s*38px[^}]*height:\s*38px/s, 'auth logo'],
  [publicShell, /\.brand img\s*\{[^}]*width:\s*34px[^}]*height:\s*34px/s, 'mobile navigation logo'],
  [consoleCss, /\.matrix-admin-brand img\s*\{[^}]*width:\s*28px[^}]*height:\s*28px/s, 'admin logo'],
  [consoleCss, /\.matrix-admin-brand img\s*\{[^}]*width:\s*26px[^}]*height:\s*26px/s, 'responsive admin logo'],
  [consoleCss, /\.matrix-admin-brand img\s*\{[^}]*width:\s*24px[^}]*height:\s*24px/s, 'compact admin logo'],
]) {
  assert.match(source, pattern, `${label} must be 20% smaller`)
}

assert.ok(docsSource.includes('PublicLayout'), 'docs page must use the new public frontend layout')
assert.ok(docsSource.includes('Matrix API 文档'), 'docs page must render the Matrix API docs title')
assert.ok(docsSource.includes('1050365180'), 'docs page must include the support QQ group')
assert.ok(docsRoute.includes("createFileRoute('/docs/')"), 'docs route must be registered in the SPA router')

assert.match(announcementEditor, /enabled:\s*boolean/, 'announcement editor must persist per-item enabled state')
assert.match(announcementEditor, /name='enabled'/, 'announcement editor must expose a per-item enabled control')
assert.match(bootstrap, /"enabled":true/, 'bootstrap announcements must explicitly be enabled')
assert.doesNotMatch(bootstrap, /kukuai upstream channel/i, 'bootstrap announcements must not expose an upstream source')
assert.match(updateOption, /'console_setting\.announcements'/, 'announcement changes must invalidate public status')
assert.match(updateOption, /'console_setting\.announcements_enabled'/, 'announcement panel changes must invalidate public status')

const docsRouteInclude = 'include /etc/nginx/conf.d/docs-routes.inc;'
for (const path of ['nginx/nginx.conf', 'nginx/conf.d/ssl.conf', 'nginx/ssl.conf.template']) {
  assert.ok(!read(path).includes(docsRouteInclude), `${path} must not intercept /docs with the old static docs include`)
}
assert.doesNotMatch(compose, /docs-routes\.inc/, 'Compose must not mount the removed static docs route include')
assert.match(compose, /\.\/nginx\/site:\/usr\/share\/nginx\/matrix-site:ro/, 'Compose must keep mounting Matrix static assets')

assert.equal(
  faviconHash,
  '1d1e30517de45f66e1fa90a801f95f5e899a7645c09612367b2ebf7f593daeb7',
  'favicon bytes must not change when resizing the display logo'
)

console.log(JSON.stringify({ pass: true, faviconHash }))
