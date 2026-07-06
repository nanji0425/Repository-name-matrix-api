# 上游切换与全站修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 切换到新上游并把模型、控制台、充值、邀请、404 和空交互一次性修到可上线状态。

**Architecture:** 后端先把上游模型同步抽象成可配置的抓取器，支持多种常见鉴权头和多种模型响应结构；再把模型供应商、价格、允许模型和前端筛选统一到同一份数据源。前端则围绕中文控制台与营销站统一清理空页、空按钮和死路由，确保所有可点击入口都有明确跳转、复制或反馈。

**Tech Stack:** Next.js App Router、NestJS、Prisma、Playwright CLI、TypeScript。

---

### Task 1: 上游模型同步

**Files:**
- Modify: `backend/prisma/model-sync.ts`
- Modify: `backend/src/modules/models/model-sync.service.ts`
- Modify: `backend/prisma/seed.ts`
- Test: `backend/prisma/model-sync.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
assertEqual(normalizeUpstreamModels({
  data: [{ id: 'gpt-5.5', owned_by: 'openai', pricing: { input: 1, output: 2 } }]
})[0].providerId, 'openai');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend test -- prisma/model-sync.spec.ts`
Expected: FAIL because provider mapping and auth fallback are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

Implement multi-header upstream fetch, provider inference from model id/owned_by, 30% markup, and startup/scheduled sync fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend test -- prisma/model-sync.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/model-sync.ts backend/src/modules/models/model-sync.service.ts backend/prisma/seed.ts backend/prisma/model-sync.spec.ts
git commit -m "feat: switch upstream model sync"
```

### Task 2: 模型广场与 API Key 选择

**Files:**
- Modify: `frontend/src/components/marketing/modelUtils.ts`
- Modify: `frontend/src/app/models/page.tsx`
- Modify: `frontend/src/app/dashboard/models/page.tsx`
- Modify: `frontend/src/app/dashboard/api-keys/page.tsx`

- [ ] **Step 1: Write the failing test**

Add a small unit test for provider detection and price formatting so `gpt-*` maps to OpenAI, `deepseek-*` maps to DeepSeek, and prices render as RMB with 30% markup.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- <target>`
Expected: FAIL until provider mapping is corrected.

- [ ] **Step 3: Write minimal implementation**

Update provider labels, remove fake supplier names, format prices in `¥`, and ensure API key model selection is backed by the active model list.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/marketing/modelUtils.ts frontend/src/app/models/page.tsx frontend/src/app/dashboard/models/page.tsx frontend/src/app/dashboard/api-keys/page.tsx
git commit -m "feat: fix model catalog and key scoping"
```

### Task 3: 控制台与营销站修补

**Files:**
- Modify: `frontend/src/components/console/ConsoleShell.tsx`
- Modify: `frontend/src/components/marketing/MarketingLayout.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/news/page.tsx`
- Modify: `frontend/src/app/about/page.tsx`
- Modify: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/register/page.tsx`
- Modify: `frontend/src/components/ThemeToggle.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Write the failing test**

Use Playwright to verify `/dashboard`, `/news`, `/about`, `/login`, `/register` and console redirects all render and clickable controls respond.

- [ ] **Step 2: Run test to verify it fails**

Run: `pwcli open http://localhost:3000` (or built app) and capture a snapshot.

- [ ] **Step 3: Write minimal implementation**

Make console/menu/theme toggles actually switch views, remove dead buttons, convert pages to pure Chinese, and keep all old `/console/...` paths redirecting cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/console/ConsoleShell.tsx frontend/src/components/marketing/MarketingLayout.tsx frontend/src/app/dashboard/page.tsx frontend/src/app/news/page.tsx frontend/src/app/about/page.tsx frontend/src/app/login/page.tsx frontend/src/app/register/page.tsx frontend/src/components/ThemeToggle.tsx frontend/src/app/globals.css
git commit -m "feat: repair console and marketing UX"
```

### Task 4: 充值、邀请与管理端

**Files:**
- Modify: `backend/src/modules/wallet/wallet.service.ts`
- Modify: `backend/src/modules/wallet/wallet.controller.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `frontend/src/app/dashboard/balance/page.tsx`
- Modify: `frontend/src/app/dashboard/invite/page.tsx`
- Modify: `frontend/src/app/admin/page.tsx`
- Modify: `frontend/src/app/admin/*`

- [ ] **Step 1: Write the failing test**

Add/update tests for invite bonus, recharge order creation, and admin stats aggregation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend test`
Expected: FAIL until recharge/admin flows are aligned.

- [ ] **Step 3: Write minimal implementation**

Keep QR recharge visible, ensure orders can be confirmed through the existing confirm endpoint, show QQ contact, make invite bonus explicit, and make admin pages focus on stats/ops rather than user-console behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/wallet/wallet.service.ts backend/src/modules/wallet/wallet.controller.ts backend/src/modules/auth/auth.service.ts frontend/src/app/dashboard/balance/page.tsx frontend/src/app/dashboard/invite/page.tsx frontend/src/app/admin/page.tsx frontend/src/app/admin
git commit -m "feat: complete recharge and admin flows"
```

### Task 5: Build and verify deployment

**Files:**
- Modify: as needed from prior tasks

- [ ] **Step 1: Run build checks**

Run: `npm --prefix frontend build` and `npm --prefix backend test`

- [ ] **Step 2: Smoke test the app**

Use Playwright to open key routes and confirm redirects, model list, key creation, recharge, and admin entry points.

- [ ] **Step 3: Deploy**

Rebuild the production containers and redeploy the stack to the current server/domain.

