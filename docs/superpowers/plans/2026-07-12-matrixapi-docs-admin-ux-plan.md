# MatrixAPI 文档、品牌与管理员后台修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 MatrixAPI 文档、Logo 和管理员后台修复部署到生产，并通过完整浏览器与运行时验收。

**Architecture:** 保留 `new-api + Nginx` 主架构；静态营销/文档页面由 `nginx/site` 提供，React 控制台由 `output/new-api-src/web/default` 构建。文档内容站内化到 `/docs`，管理员修复遵循现有 API 与 React Query 缓存模式。

**Tech Stack:** Nginx、静态 HTML/CSS/JS、React/TypeScript、Go、PostgreSQL、Redis、Docker Compose、Playwright。

---

### Task 1: 建立 Logo 与文档回归基线

**Files:**
- Modify: `scripts/qa-registration-brand.mjs`
- Modify: `scripts/qa-public-site-static.mjs`
- Create: `scripts/qa-docs-local.mjs`

- [ ] **Step 1: 写失败断言**
  - 断言所有文档导航和页脚链接为 `/docs` 或本页锚点。
  - 断言 `docx.kkkliao.cn` 不出现在首页、排行榜、文档页、品牌缓存和 `/api/status` 期望值中。
  - 断言首页/认证页 Logo 尺寸分别为目标尺寸范围，favicon 四角保持白色。
- [ ] **Step 2: 运行回归确认当前失败**
  - Run: `node scripts/qa-docs-local.mjs`
  - Expected: FAIL，报告外部文档链接和旧 Logo 尺寸。
- [ ] **Step 3: 保留脚本为后续验收入口**
  - 所有断言输出 JSON，失败时 `process.exit(1)`，不读取或输出任何秘密。

### Task 2: 站内化文档并修复所有导航

**Files:**
- Modify: `nginx/site/docs.html`
- Modify: `nginx/site/index.html`
- Modify: `nginx/site/rankings.html`
- Modify: `nginx/site/pricing.html`
- Modify: `nginx/site/legal.html`
- Modify: `nginx/site/brand-init.js`
- Modify: `scripts/bootstrap-new-api-db.sh`
- Modify: `scripts/bootstrap-new-api.mjs`
- Modify: `scripts/qa-production-runtime.mjs`

- [ ] **Step 1: 将参考站章节改写为 MatrixAPI 内容**
  - 保留站内锚点：`#purchase-flow`, `#overview`, `#quick-start`, `#nodejs`, `#endpoints`, `#ccswitch`, `#codexpp`, `#codex`, `#claude`, `#vscode`, `#errors`。
  - 把参考站域名、兑换码和第三方联系方式替换为 MatrixAPI 的注册、钱包、API Key、`https://matrixapi.online/v1` 和支付宝流程。
- [ ] **Step 2: 删除文档外跳入口**
  - 首页、排行榜、模型广场、页脚和文档页按钮全部指向 `/docs` 或章节锚点。
  - `brand-init.js` 的 `MATRIX.docs` 改为 `/docs`，站点状态缓存同步改写。
- [ ] **Step 3: 持久化后台文档配置**
  - 初始化脚本的 `DocsLink` 与 `general_setting.docs_link` 改为 `/docs`。
  - 运行时 QA 允许且优先要求 `/docs`。
- [ ] **Step 4: 运行静态文档回归**
  - Run: `node scripts/qa-docs-local.mjs`
  - Expected: PASS，所有章节可定位、外部文档主机为 0。

### Task 3: Logo 缩小 25% 并验证响应式布局

**Files:**
- Modify: `nginx/site/brand-init.js`
- Modify: `nginx/site/public-shell.css`
- Modify: `nginx/site/matrix-console.css`
- Modify: `nginx/site/index.html`
- Modify: `nginx/site/docs.html`
- Modify: `nginx/site/rankings.html`
- Modify: `nginx/site/sign-in.html`
- Modify: `nginx/site/sign-up.html`

- [ ] **Step 1: 将尺寸集中到目标值**
  - 注入规则使用 72/60/72/36/54px，静态图片不再覆盖为更大尺寸。
  - 保持 `background: transparent`，favicon 继续白底。
- [ ] **Step 2: 运行品牌与布局回归**
  - Run: `node scripts/qa-registration-brand.mjs`
  - Run: `node scripts/qa-visual-responsive.mjs`
  - Expected: PASS，无横向溢出、破图或 Logo 超出容器。

### Task 4: 修复渠道检测失败反馈与缓存刷新

**Files:**
- Modify: `output/new-api-src/web/default/src/features/channels/api.ts`
- Modify: `output/new-api-src/web/default/src/features/channels/lib/channel-test.ts`
- Modify: `output/new-api-src/web/default/src/features/channels/components/dialogs/channel-test-dialog.tsx`
- Modify: `output/new-api-src/web/default/src/features/channels/components/drawers/channel-mutate-drawer.tsx`
- Test: `output/new-api-src/web/default/src/features/channels/**/__tests__/channel-test*.test.ts`

- [ ] **Step 1: 写渠道检测失败用例**
  - 覆盖 `success:false`、HTTP 401/403/429、网络错误、空响应和成功响应。
  - 断言错误消息优先使用后端 `message`，其次使用嵌套 `error.message` 和 `upstream_status`。
- [ ] **Step 2: 运行失败用例确认当前缺陷**
  - Run: `cd output/new-api-src/web/default; bun test`
  - Expected: FAIL 或复现当前错误提示/状态不刷新的行为。
- [ ] **Step 3: 实现统一结果解析**
  - 在 `channel-test.ts` 提供纯函数，统一将 Axios 错误、业务错误和上游响应转换为 `TestResult`。
  - 单条/批量测试成功后更新 `response_time/test_time`，失败后保留失败状态并允许重试。
- [ ] **Step 4: 运行前端测试和类型检查**
  - Run: `cd output/new-api-src/web/default; bun test`
  - Run: `cd output/new-api-src/web/default; bun run typecheck`
  - Expected: PASS。

### Task 5: 完整模型描述编辑/展示链路

**Files:**
- Modify: `output/new-api-src/web/default/src/features/models/components/drawers/model-mutate-drawer.tsx`
- Modify: `output/new-api-src/web/default/src/features/models/components/models-columns.tsx`
- Modify: `output/new-api-src/web/default/src/features/models/components/description-cell.tsx`
- Modify: `output/new-api-src/web/default/src/features/models/lib/model-form.ts`
- Modify: `output/new-api-src/web/default/src/features/models/api.ts`
- Test: `output/new-api-src/web/default/src/features/models/**/__tests__/model-description*.test.ts`

- [ ] **Step 1: 写描述字段回填、提交和空值用例**
  - 编辑已有模型时回填原描述；保存 payload 包含 `description`；空值显示“未设置”。
- [ ] **Step 2: 运行用例确认当前链路状态**
  - Run: `cd output/new-api-src/web/default; bun test`
- [ ] **Step 3: 只补缺失环节**
  - 保留现有 schema 与后端字段，修复缓存刷新、表格单元格点击、错误提示或类型不一致。
- [ ] **Step 4: 运行模型后台回归**
  - 覆盖模型列表、编辑抽屉、描述查看、同步模型后列表刷新。

### Task 6: 管理后台综合回归与构建

**Files:**
- Modify: `scripts/qa-admin-backend-coverage.mjs`
- Create: `scripts/qa-admin-channel-model-description.mjs`
- Modify: `scripts/qa-live-model-plaza.mjs`

- [ ] **Step 1: 增加后台页面和交互断言**
  - 管理员登录后检查渠道检测、模型描述、模型同步、系统设置、用户、兑换码、订阅、钱包和日志页面。
- [ ] **Step 2: 运行本地构建与测试**
  - Run: `cd output/new-api-src/web/default; bun run build`
  - Run: `cd output/new-api-src; go test ./controller ./router ./setting/operation_setting ./setting/system_setting ./setting/model_setting`
  - Expected: PASS。
- [ ] **Step 3: 运行全量本地 QA**
  - Run: `node scripts/qa-docs-local.mjs`
  - Run: `node scripts/qa-registration-brand.mjs`
  - Run: `node scripts/qa-live-model-plaza.mjs`
  - Run: `node scripts/qa-admin-channel-model-description.mjs`

### Task 7: 备份、部署与生产验收

**Files:**
- No production secrets or `.env` changes.
- Deploy: existing `deploy.ps1`/Docker Compose workflow.

- [ ] **Step 1: 运行工作区检查**
  - Run: `git diff --check`
  - Run: `node --check nginx/site/brand-init.js`
- [ ] **Step 2: 备份并部署**
  - 使用 `mz.pem` 连接服务器，先备份 `/root/token_API`，保留 `.env`、证书、卷和运行时数据，再重建镜像并强制重建 Nginx。
- [ ] **Step 3: 运行生产验证**
  - Run: `node scripts/qa-public-route-audit.mjs`
  - Run: `node scripts/qa-production-security.mjs`
  - Run: `node scripts/qa-production-runtime.mjs`
  - Run: `node scripts/qa-admin-channel-model-description.mjs`
  - Run remotely: `docker compose ps` and `docker exec matrixapi-nginx nginx -t`
- [ ] **Step 4: 交付证据**
  - 仅在所有关键脚本 `failures: []`、容器健康且 Nginx 测试成功后报告完成；不执行真实支付。
