# MatrixAPI 项目交接文档

## 1. 项目目标

MatrixAPI 是一个面向开发者和企业用户的 AI 模型聚合平台，目标是提供：

- OpenAI 兼容 API 网关
- 多上游模型接入与路由
- 用户令牌管理
- 余额充值与计费
- 请求日志、消费统计
- 管理后台
- 支付接入
- 中英文切换、明暗主题
- 科技感动态官网与控制台 UI

当前方向已从自研 Next/Nest 方案切换为基于 `QuantumNous/new-api` / `calciumion/new-api` 二次开发。

## 2. 当前目录结构

本地工作目录：

```text
E:\token_API
```

关键目录：

```text
E:\token_API
├─ docker-compose.yml
├─ docker-compose.legacy.yml
├─ nginx
│  ├─ nginx.conf
│  ├─ ssl.conf.template
│  ├─ conf.d
│  │  └─ ssl.conf
│  └─ site
│     ├─ index.html
│     ├─ app.js
│     ├─ brand-init.js
│     └─ matrix-console.css
├─ scripts
│  ├─ qa-helpers.mjs
│  ├─ qa-homepage-ui.mjs
│  ├─ qa-console-theme-lang.mjs
│  ├─ qa-token-import-ui.mjs
│  ├─ qa-payment-flow.mjs
│  ├─ qa-subscription-guide.mjs
│  ├─ qa-api-info-actions.mjs
│  ├─ qa-click-audit.mjs
│  └─ qa-deployment-guide.mjs
├─ backend
├─ frontend
└─ nginx
```

服务器项目路径：

```text
/root/token_API
```

线上地址：

```text
https://matrixapi.online
```

## 3. 已完成的功能

- 已切换到 `new-api` 作为主系统基础。
- 保留旧自研项目为 `docker-compose.legacy.yml`。
- 已配置 Docker 栈：`new-api`、PostgreSQL、Redis、Nginx。
- 已接入 MatrixAPI 品牌静态首页。
- 已注入控制台自定义样式与功能：
  - MatrixAPI 品牌文案
  - 控制台主题切换按钮
  - 中英文切换按钮
  - 令牌导入按钮
  - 支持邮箱展示
  - 部分控制台页面增强
- 已实现令牌导入弹窗，支持多个客户端配置导入入口。
- 已修复令牌导入下拉层被外框裁剪的问题。
- 已将支付限制为支付宝。
- 已去除不需要的微信收银台文案。
- 已设置上游地址为 `https://api.bblabu.chat/`。
- 已按上游价格基础加价 40% 的方向配置模型倍率。
- 已配置 ZPay 支付流程：
  - 支付方式：支付宝
  - notify：`https://matrixapi.online/api/user/epay/notify`
  - return：`https://matrixapi.online/console/log`
- 已更新 Nginx 静态资源缓存策略。
- 已添加多个 Playwright QA 脚本用于自动检查 UI、支付、主题、语言、点击行为。

## 4. 正在开发的功能

- 完善控制台所有可点击组件，避免空点击、无跳转、逻辑不完整。
- 对比上游站点 `https://api.bblabu.chat/` 补齐缺失功能。
- 继续美化官网与控制台 UI：
  - 动态粒子效果
  - 明暗主题完整适配
  - 中英文全站实时切换
  - 科技感视觉风格
- 完善 API 文档页面，参考：
  - `https://docx.kkkliao.cn/`
  - `https://docx.kkkliao.cn/#ccswitch`
- 完善令牌导入功能，参考用户截图中的应用列表与交互。
- 完善充值、订阅、文档、模型、部署说明页面。
- 优化冷启动加载慢或空白的问题。

## 5. 关键技术栈

当前主栈：

```text
new-api / calciumion/new-api
Docker Compose
PostgreSQL
Redis
Nginx
静态 JS/CSS 注入
Playwright QA
```

旧方案保留但不是当前主线：

```text
Next.js 15
TypeScript
TailwindCSS
NestJS
Prisma
PostgreSQL
Redis
BullMQ
MinIO
```

## 6. 重要文件说明

- `nginx/site/index.html`：MatrixAPI 官网静态入口。
- `nginx/site/app.js`：官网交互逻辑。
- `nginx/site/brand-init.js`：核心注入脚本，负责控制台品牌替换、主题切换、语言切换、令牌导入、页面增强等。
- `nginx/site/matrix-console.css`：控制台自定义视觉样式。
- `nginx/nginx.conf`、`nginx/conf.d/ssl.conf`、`nginx/ssl.conf.template`：Nginx 代理、缓存、SSL、静态资源策略。
- `scripts/qa-helpers.mjs`：QA 通用登录、请求、脱敏辅助。
- `scripts/qa-*.mjs`：Playwright 自动化检查脚本。
- `docker-compose.yml`：当前线上主栈配置。
- `docker-compose.legacy.yml`：旧自研 Next/Nest 栈备份，不要随意删除。

## 7. 已知问题

- 冷打开部分 SPA 子路由时可能出现空白：
  - `/console/deployment`
  - `/console/models`
  - `/console/setting`
  - `/pricing`
- 现象：
  - 页面只有 `<div id="root"></div>`
  - JS 大文件加载很慢
  - 服务器内部访问快，公网下载慢
- 初步判断：
  - 更像公网静态资源传输慢或大包加载问题，不像应用 JS 报错。
- 支付 QA 容易触发接口限流：
  - `/api/user/pay` 多次测试会返回 429。
- 部分页面的动态语言切换和主题反转仍需继续逐页验证。
- 部分控制台页面仍可能存在原生 new-api 文案、无效按钮或跳转不完整。
- 终端可能出现中文乱码，不能仅凭 PowerShell 输出判断文件编码错误。
- 仓库和历史上下文中出现过真实密钥、密码、Token，后续必须脱敏，并建议用户轮换所有泄露凭据。

## 8. 下一步要做什么

优先顺序：

1. 修复或缓解 SPA 冷启动空白问题。
2. 继续跑 QA：

```powershell
node scripts\qa-homepage-ui.mjs
node scripts\qa-console-theme-lang.mjs
node scripts\qa-token-import-ui.mjs
node scripts\qa-payment-flow.mjs
node scripts\qa-subscription-guide.mjs
node scripts\qa-api-info-actions.mjs
node scripts\qa-click-audit.mjs
node scripts\qa-deployment-guide.mjs
```

3. 逐页检查控制台：
   - `/console`
   - `/console/token`
   - `/console/topup`
   - `/console/subscription`
   - `/console/models`
   - `/console/channel`
   - `/console/redemption`
   - `/console/deployment`
   - `/console/setting`
4. 对比上游 `api.bblabu.chat`，补齐缺失页面和功能。
5. 完善 API 文档内容，参考 `docx.kkkliao.cn`。
6. 检查所有按钮、卡片、菜单、链接是否有明确行为。
7. 部署前执行：

```powershell
git diff --check
```

8. 同步到服务器后执行：

```bash
cd /root/token_API
docker exec matrixapi-nginx nginx -t
docker compose restart nginx
```

## 9. 不能改动 / 需要注意

- 不要泄露、打印、提交任何真实密钥、密码、Token、Cookie、私钥。
- 用户提供过的 GitHub Token、服务器密码、支付密钥、上游 API Key 都必须视为已泄露，回复中只能写 `<REDACTED>`。
- 不要把真实密钥写入源码、测试、文档、日志。
- 不要删除 `docker-compose.legacy.yml`，它是旧系统备份。
- 不要大范围重构 new-api 源码，当前主要通过 Nginx 静态注入和配置增强。
- 不要破坏 new-api 原有核心能力：
  - 用户
  - 令牌
  - 渠道
  - 计费
  - 日志
  - 兑换码
  - 管理后台
- 支付只能保留支付宝，不要恢复微信、Stripe、USDT 文案。
- 对外展示价格必须基于上游价格加价 40%。
- 线上操作前先备份配置和数据库。
- Playwright 测试要注意登录、限流和冷启动问题，不要把网络慢误判为业务逻辑错误。
