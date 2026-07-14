# Admin Data Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-version administrator data panel that shows today and all-time platform metrics.

**Architecture:** Add a Go admin metrics endpoint backed by GORM aggregate queries, then add a React authenticated admin page at `/admin-dashboard`. The page uses React Query through the shared API client and appears in the Admin sidebar only for administrators.

**Tech Stack:** Go, Gin, GORM, React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, Bun, Node QA scripts.

---

### Task 1: Add QA contract

**Files:**
- Create: `scripts/qa-admin-data-panel.mjs`

- [x] **Step 1: Write the failing QA**

Create a Node script that checks for the backend route, frontend route, sidebar item, API client, required UI labels, and forbidden public wording.

- [x] **Step 2: Run QA to verify it fails**

Run: `node scripts\qa-admin-data-panel.mjs`

Expected: FAIL because the feature files do not exist yet.

### Task 2: Add backend metrics model and controller

**Files:**
- Create: `output/new-api-src/model/admin_dashboard.go`
- Create: `output/new-api-src/controller/admin_dashboard.go`
- Modify: `output/new-api-src/router/api-router.go`

- [x] **Step 1: Add aggregate model functions**

Create typed structs for summary cards, hourly buckets, top models, error summary, and user activity. Query users, logs, and topups with cross-database GORM-compatible queries.

- [x] **Step 2: Add controller and route**

Expose `GET /api/admin/dashboard/metrics` under `middleware.AdminAuth()`. Return `common.ApiSuccess(c, data)` on success and `common.ApiError(c, err)` on failure.

- [x] **Step 3: Run Go checks**

Run: `go test ./model ./controller`

Expected: PASS.

### Task 3: Add frontend data panel feature

**Files:**
- Create: `output/new-api-src/web/default/src/features/admin-dashboard/types.ts`
- Create: `output/new-api-src/web/default/src/features/admin-dashboard/api.ts`
- Create: `output/new-api-src/web/default/src/features/admin-dashboard/lib/format.ts`
- Create: `output/new-api-src/web/default/src/features/admin-dashboard/index.tsx`
- Create: `output/new-api-src/web/default/src/routes/_authenticated/admin-dashboard/index.tsx`
- Modify: `output/new-api-src/web/default/src/hooks/use-sidebar-data.ts`
- Modify: `output/new-api-src/web/default/src/hooks/use-sidebar-config.ts`
- Modify: `output/new-api-src/web/default/src/features/system-settings/maintenance/config.ts`
- Modify: `output/new-api-src/web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx`

- [x] **Step 1: Add API types and client**

Use `api.get('/api/admin/dashboard/metrics')` and stable TypeScript response types.

- [x] **Step 2: Add admin-only route**

Create a TanStack route with `beforeLoad` redirecting non-admin users to `/403`.

- [x] **Step 3: Add UI**

Render 8 metric cards, hourly trend, Top 5 models, error summary, user activity, refresh button, loading skeleton, and retryable error state.

- [x] **Step 4: Add sidebar entry and module config**

Add “数据面板”/`Data Panel` under Admin. Add `dashboard` to sidebar module defaults and settings UI.

### Task 4: Verify and commit

**Files:**
- All files from Tasks 1-3

- [x] **Step 1: Run QA**

Run: `node scripts\qa-admin-data-panel.mjs`

Expected: PASS.

- [x] **Step 2: Run frontend checks**

Run from `output/new-api-src/web/default`: `bun run typecheck`

Expected: PASS.

- [x] **Step 3: Run backend checks**

Run from `output/new-api-src`: `go test ./model ./controller`

Expected: PASS.

- [x] **Step 4: Inspect diff and commit only relevant files**

Run: `git status --short` and stage only the admin data panel files.

Commit message: `feat(admin): add data panel metrics`
