# Matrix API Production Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the approved Matrix API brand, wallet, navigation, pricing, and Playground balance fixes without changing the active New API + Nginx architecture.

**Architecture:** Nginx will stop intercepting the native wallet route, while public branding remains injected through the existing `brand-init.js` and static asset mounts. New API frontend changes will own sidebar, API-key navigation, and Playground UX; the Go Playground controller will enforce the same wallet-only balance rule server-side. Bootstrap will persist payment compliance, sidebar visibility, and ratio options through the existing authenticated option API.

**Tech Stack:** TypeScript/React, TanStack Router, Vite/Bun frontend build, Go/Gin backend, Node bootstrap scripts, Nginx, Docker Compose, PostgreSQL, Playwright QA.

---

### Task 1: Add failing regression coverage

**Files:**
- Modify: `scripts/qa-registration-brand.mjs`
- Modify: `scripts/qa-payment-flow.mjs`
- Create: `scripts/qa-navigation-playground-balance.mjs`
- Modify: `scripts/bootstrap-new-api.mjs`

- [ ] **Step 1: Write assertions for the requested behavior before changing production code.**

  Assert that the bootstrap compliance request contains JSON `{ confirmed: true }`, default `GroupRatio` is `{"default":1}`, `SidebarModulesAdmin` sets `chat:false`, wallet route is not statically intercepted, brand strings contain `Matrix API`, the API-key action targets `/playground`, and the Playground guard covers send/retry/edit plus zero-quota messaging.

- [ ] **Step 2: Run the focused scripts and record the expected failures.**

  Run `node scripts/qa-registration-brand.mjs`, `node scripts/qa-payment-flow.mjs`, and `node scripts/qa-navigation-playground-balance.mjs`. The pre-fix run must fail on the missing compliance body, stale `New API`/wallet route, default `1.4`, Chat menu, and missing balance guard.

### Task 2: Fix bootstrap and Nginx wallet routing

**Files:**
- Modify: `scripts/bootstrap-new-api.mjs:207-246`
- Modify: `nginx/conf.d/ssl.conf:109-121`
- Modify: `nginx/ssl.conf.template:109-121`

- [ ] **Step 1: Send the compliance body and fail on failure.**

  Change `confirmPaymentCompliance()` to send `headers: {'content-type':'application/json'}` and `body: JSON.stringify({ confirmed: true })`; remove the catch-and-continue behavior so a locked payment configuration stops bootstrap.

- [ ] **Step 2: Persist approved options.**

  Set `GroupRatio` default to `JSON.stringify({ default: 1 })` and add `SidebarModulesAdmin` with a serialized config whose `chat.chat` is false. Keep `TopupGroupRatio` at `{"default":1}` and preserve Alipay-only `PayMethods`.

- [ ] **Step 3: Remove retired static wallet locations.**

  Delete only the exact `/wallet` and `/wallet/` static `try_files /wallet.html` blocks from both Nginx configs; keep `/topup` redirecting to `/wallet` and let the existing SPA fallback serve native `/_authenticated/wallet/`.

- [ ] **Step 4: Run syntax checks.**

  Run `node --check scripts/bootstrap-new-api.mjs` and `git diff --check`.

### Task 3: Apply Matrix API branding and navigation changes

**Files:**
- Modify: `nginx/site/brand-init.js`
- Modify: `nginx/site/index.html`, `nginx/site/docs.html`, `nginx/site/pricing.html`, `nginx/site/rankings.html`, `nginx/site/legal.html`, `nginx/site/wallet.html`
- Modify: `output/new-api-src/web/default/src/hooks/use-sidebar-data.ts`
- Modify: `output/new-api-src/web/default/src/hooks/use-sidebar-config.ts`
- Modify: `output/new-api-src/web/default/src/features/system-settings/maintenance/config.ts`
- Modify: `output/new-api-src/web/default/src/features/keys/components/data-table-row-actions.tsx`

- [ ] **Step 1: Write the failing source assertions.**

  Assert no user-visible `New API` brand remains in the injected/public/native branding paths, the transparent logo URL is shared by favicon and image metadata, logo display sizing is doubled, the second Chat sidebar item is absent/disabled, and the API-key Chat action navigates exactly to `/playground` without `resolveRealKey`.

- [ ] **Step 2: Implement the smallest source changes.**

  Use `Matrix API` for visible labels and document titles, add a cache-busted favicon link using the transparent logo, double only the logo display dimensions, remove the static Chat item and set both default sidebar configs to false, and replace the external chat-preset action with `navigate({ to: '/playground' })`.

- [ ] **Step 3: Run the source QA scripts.**

  Run `node scripts/qa-registration-brand.mjs` and `node scripts/qa-matrix-console-source.mjs`.

### Task 4: Enforce wallet balance in Playground

**Files:**
- Modify: `output/new-api-src/web/default/src/features/playground/index.tsx`
- Modify: `output/new-api-src/web/default/src/features/playground/hooks/use-playground-conversation.ts`
- Modify: `output/new-api-src/web/default/src/features/playground/components/input/playground-input.tsx`
- Modify: `output/new-api-src/web/default/src/features/playground/lib/input/input-control-utils.ts`
- Modify: `output/new-api-src/web/default/src/features/playground/lib/streaming/request-error-utils.ts`
- Modify: `output/new-api-src/controller/playground.go`
- Create: `output/new-api-src/controller/playground_balance_test.go`

- [ ] **Step 1: Add a failing Go test for zero/negative wallet quota.**

  Exercise the Playground controller guard with quota `0` and `-1`, assert HTTP 403, and assert no billing session/request is created; assert a positive quota proceeds to the existing flow.

- [ ] **Step 2: Add a failing frontend/source test.**

  Assert the shared send path refreshes `/api/user/self`, treats unknown quota as disabled, blocks `quota <= 0` for send/retry/edit, and exposes a recharge action/message.

- [ ] **Step 3: Implement shared guard behavior.**

  Fetch current self data before a new request, block all three submission paths before `sendChat`, show a localized “余额不足，请先充值” toast/action linking to `/wallet`, and keep the input disabled while quota is unknown or zero.

- [ ] **Step 4: Implement backend enforcement and error extraction.**

  Reject zero/negative wallet quota before `NewBillingSession`, independent of subscription preference, and parse nested `response.data.error.message` so direct 403 responses remain useful.

- [ ] **Step 5: Run focused frontend and Go tests.**

  Run the new QA script and `go test ./controller -run Playground` from `output/new-api-src`.

### Task 5: Build, deploy, and verify

**Files:**
- Modify only generated build artifacts and deployment copies needed by the existing Compose setup.

- [ ] **Step 1: Run local verification.**

  Run `node scripts/qa-registration-brand.mjs`, `node scripts/qa-payment-flow.mjs`, `node scripts/qa-navigation-playground-balance.mjs`, `node scripts/qa-matrix-console-source.mjs`, `node --check scripts/bootstrap-new-api.mjs`, frontend build, Go tests/build, and `git diff --check`.

- [ ] **Step 2: Create a timestamped server backup before overwrite.**

  Back up the current Nginx config/assets and record the existing Compose state under `/root/token_API/backups/` without exposing credentials.

- [ ] **Step 3: Deploy and bootstrap.**

  Copy the changed Nginx/scripts/source files using `mz.pem`, rebuild/recreate only the affected services, run the one-time Node bootstrap container, and verify payment compliance options are persisted.

- [ ] **Step 4: Run live API and browser verification.**

  Confirm `/api/user/topup/info` reports online top-up enabled and exactly Alipay, `/`, `/wallet`, `/playground`, `/keys`, and `/channels` return 200, then use an authenticated browser to verify Matrix API branding, doubled logo, favicon, wallet amount/payment controls, hidden second Chat row, `/playground` navigation, zero-balance blocking, and positive-balance chat behavior.

- [ ] **Step 5: Run production health checks.**

  Run `docker exec matrixapi-nginx nginx -t`, `docker compose ps`, and the existing public route/security/runtime QA scripts. Stop only when failures are empty or report the exact remaining blocker.

