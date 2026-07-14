#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const docsHtml = read('nginx/site/docs.html')
const apiBootstrap = read('scripts/bootstrap-new-api.mjs')
const dbBootstrap = read('scripts/bootstrap-new-api-db.sh')
const apiAnnouncements = apiBootstrap.match(/console_setting\.announcements', JSON\.stringify\(\[[\s\S]*?\]\)\)/)?.[0] || ''

const publicFacingSources = {
  'nginx/site/docs.html': docsHtml,
  'scripts/bootstrap-new-api.mjs announcements': apiAnnouncements,
  'scripts/bootstrap-new-api-db.sh': [
    dbBootstrap.match(/\('console_setting\.api_info', '[\s\S]*?'\),/)?.[0] || '',
    dbBootstrap.match(/\('console_setting\.faq', '[\s\S]*?'\),/)?.[0] || '',
    dbBootstrap.match(/\('console_setting\.announcements', '[\s\S]*?'\),/)?.[0] || '',
  ].join('\n'),
}

for (const phrase of [
  '快速开始',
  'API 接入',
  '客户端配置',
  '模型与价格',
  '充值与余额',
  '使用日志',
  '常见问题',
  '账户安全',
  'https://matrixapi.online/v1',
  'Cherry Studio',
  'Chatbox',
  'LobeChat',
]) {
  assert.ok(docsHtml.includes(phrase), `docs page must include Chinese docs section: ${phrase}`)
}

for (const phrase of [
  'Matrix API 接口已开放',
  '在线充值当前支持支付宝',
  '教程文档已上线',
]) {
  assert.ok(apiBootstrap.includes(phrase), `API bootstrap announcements must be Chinese: ${phrase}`)
  assert.ok(dbBootstrap.includes(phrase), `DB bootstrap announcements must be Chinese: ${phrase}`)
}

for (const phrase of [
  '如何创建 API Key？',
  '如何在客户端里使用 Matrix API？',
  '模型价格如何计算？',
  '在哪里查看使用日志？',
]) {
  assert.ok(dbBootstrap.includes(phrase), `console FAQ must be Chinese: ${phrase}`)
}

for (const phrase of [
  'OpenAI 兼容接口',
  '教程文档',
  '联系支持',
  '价格中心',
]) {
  assert.ok(dbBootstrap.includes(phrase), `console API info must be Chinese: ${phrase}`)
}

const forbiddenPublicWords = [
  /上游/,
  /渠道/,
  /加价/,
  /成本价/,
  /同步上游/,
  /upstream/i,
  /retail pricing/i,
  /group ratio/i,
]

for (const [name, source] of Object.entries(publicFacingSources)) {
  for (const pattern of forbiddenPublicWords) {
    assert.doesNotMatch(source, pattern, `${name} must not expose backend supplier/pricing wording: ${pattern}`)
  }
}

console.log(JSON.stringify({ pass: true }))
