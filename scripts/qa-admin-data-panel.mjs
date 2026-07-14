#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const exists = (path) => existsSync(resolve(root, path))

const requiredFiles = [
  'output/new-api-src/model/admin_dashboard.go',
  'output/new-api-src/controller/admin_dashboard.go',
  'output/new-api-src/web/default/src/features/admin-dashboard/types.ts',
  'output/new-api-src/web/default/src/features/admin-dashboard/api.ts',
  'output/new-api-src/web/default/src/features/admin-dashboard/lib/format.ts',
  'output/new-api-src/web/default/src/features/admin-dashboard/index.tsx',
  'output/new-api-src/web/default/src/routes/_authenticated/admin-dashboard/index.tsx',
]

for (const file of requiredFiles) {
  assert.ok(exists(file), `required admin data panel file is missing: ${file}`)
}

const router = read('output/new-api-src/router/api-router.go')
assert.match(
  router,
  /GET\("\/admin\/dashboard\/metrics",\s*middleware\.AdminAuth\(\),\s*controller\.GetAdminDashboardMetrics\)/,
  'backend router must expose GET /api/admin/dashboard/metrics with AdminAuth'
)

const controller = read('output/new-api-src/controller/admin_dashboard.go')
assert.match(
  controller,
  /func GetAdminDashboardMetrics\(c \*gin\.Context\)/,
  'controller must define GetAdminDashboardMetrics'
)

const model = read('output/new-api-src/model/admin_dashboard.go')
for (const phrase of [
  'AdminDashboardMetrics',
  'TodayNewUsers',
  'TotalUsers',
  'TodayRequests',
  'TodayTokens',
  'TotalTokens',
  'TodayQuota',
  'TodayTopup',
  'TodayFailedRequests',
  'HourlyRequests',
  'TopModels',
  'ErrorSummary',
  'UserActivity',
]) {
  assert.ok(model.includes(phrase), `backend metrics model must include ${phrase}`)
}

const route = read(
  'output/new-api-src/web/default/src/routes/_authenticated/admin-dashboard/index.tsx'
)
assert.ok(route.includes("createFileRoute('/_authenticated/admin-dashboard/')"))
assert.ok(route.includes('ROLE.ADMIN'), 'route must guard admin-only access')

const api = read('output/new-api-src/web/default/src/features/admin-dashboard/api.ts')
assert.ok(
  api.includes("'/api/admin/dashboard/metrics'"),
  'frontend API client must call /api/admin/dashboard/metrics'
)

const page = read('output/new-api-src/web/default/src/features/admin-dashboard/index.tsx')
for (const phrase of [
  'Data Panel',
  'Today New Users',
  'Total Users',
  'Today Requests',
  'Today Tokens',
  'Total Tokens',
  'Today Spend',
  'Today Top-up',
  'Failed Requests',
  'Top Models',
  'Recent Exceptions',
  'User Activity',
]) {
  assert.ok(page.includes(phrase), `admin data panel UI must include text key: ${phrase}`)
}
assert.ok(page.includes('refetch'), 'admin data panel must provide a refresh/retry path')

const sidebar = read('output/new-api-src/web/default/src/hooks/use-sidebar-data.ts')
assert.ok(sidebar.includes("t('Data Panel')"), 'sidebar must include Data Panel')
assert.ok(sidebar.includes("url: '/admin-dashboard'"), 'sidebar must link /admin-dashboard')

const sidebarConfig = [
  read('output/new-api-src/web/default/src/hooks/use-sidebar-config.ts'),
  read('output/new-api-src/web/default/src/features/system-settings/maintenance/config.ts'),
  read(
    'output/new-api-src/web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx'
  ),
].join('\n')
assert.ok(sidebarConfig.includes('dashboard: true'), 'sidebar config must expose admin dashboard toggle')
assert.ok(sidebarConfig.includes("'/admin-dashboard'"), 'sidebar config must map /admin-dashboard')

const publicFacingNewSources = [
  page,
  sidebar,
  api,
  route,
  read('output/new-api-src/web/default/src/features/admin-dashboard/types.ts'),
].join('\n')
for (const pattern of [/上游/, /渠道/, /加价/, /成本价/, /同步上游/]) {
  assert.doesNotMatch(
    publicFacingNewSources,
    pattern,
    `admin data panel must not expose internal supplier/pricing wording: ${pattern}`
  )
}

console.log(JSON.stringify({ pass: true }))
