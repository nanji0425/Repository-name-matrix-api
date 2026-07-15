#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(path, 'utf8')
const [rankings, docs, docsRoute, home] = await Promise.all([
  read('nginx/site/rankings.html'),
  read('output/new-api-src/web/default/src/features/docs/index.tsx'),
  read('output/new-api-src/web/default/src/routes/docs/index.tsx'),
  read('nginx/site/index.html'),
])

assert.ok(rankings.includes('data-range="今天"'), 'rankings must expose a today tab')
assert.ok(rankings.includes('data-range="本周"'), 'rankings must expose a week tab')
assert.ok(rankings.includes('热门模型'), 'rankings must include the usage chart card')
assert.ok(rankings.includes('市场份额'), 'rankings must include market share')
assert.ok(rankings.includes('趋势'), 'rankings must include trend cards')
assert.ok(rankings.includes('data-range-label'), 'rankings tabs must update the visible range label')
assert.ok(rankings.includes('/pricing?model=gpt-5.5'), 'ranked models must link to the model plaza')
assert.ok(!rankings.includes('docx.kkkliao.cn'), 'rankings must not link to the external reference site')

assert.ok(docs.includes('PublicLayout'), 'docs must use the new public React layout')
assert.ok(docs.includes('Matrix API 文档'), 'docs must include the Matrix API docs title')
assert.ok(docs.includes('https://matrixapi.online/v1'), 'docs must provide the Matrix API endpoint')
assert.ok(docs.includes('3315419516@qq.com'), 'docs must include the support email')
assert.ok(docs.includes('1050365180'), 'docs must include the support QQ group')
assert.ok(docsRoute.includes("createFileRoute('/docs/')"), 'docs must be registered as a SPA route')
assert.ok(!docs.includes('docx.kkkliao.cn'), 'docs must not link to the external reference site')
assert.doesNotMatch(docs, /上游|渠道|加价|成本价|upstream/i, 'docs must not expose backend supplier wording')
assert.match(docs, /支付宝|付款|充值/i, 'docs must explain the supported payment/top-up flow')
assert.doesNotMatch(docs, /WeChat|Stripe|USDT|微信|PayPal/i, 'docs must not advertise unsupported payment methods')

assert.ok(home.includes('href="/docs"'), 'home must link the local MatrixAPI docs page')
assert.ok(!home.includes('docx.kkkliao.cn'), 'home must not link to the external reference site')
assert.ok(home.includes('管理 API 密钥'), 'home component cards must have working key management links')
assert.ok(home.includes('查看调用日志'), 'home component cards must have working log links')
assert.ok(home.includes('浏览模型广场'), 'home component cards must have working model links')

console.log(JSON.stringify({ pass: true }))
