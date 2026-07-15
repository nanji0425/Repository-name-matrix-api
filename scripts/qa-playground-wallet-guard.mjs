#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const guard = read(
  'output/new-api-src/web/default/src/features/playground/hooks/use-playground-wallet-guard.ts'
)
const conversation = read(
  'output/new-api-src/web/default/src/features/playground/hooks/use-playground-conversation.ts'
)
const input = read(
  'output/new-api-src/web/default/src/features/playground/lib/input/input-control-utils.ts'
)
const errors = read(
  'output/new-api-src/web/default/src/features/playground/lib/streaming/request-error-utils.ts'
)
const controller = read('output/new-api-src/controller/playground.go')

assert.match(guard, /getSelf\(\)/, 'wallet guard must refresh current user data')
assert.match(guard, /quota\s*<=\s*0|quota.*null/i, 'wallet guard must block unknown/empty quota')
assert.match(guard, /\/wallet|Recharge|充值/i, 'wallet guard must provide a recharge destination')
assert.match(conversation, /ensureWalletBalance/, 'conversation actions must use the shared wallet guard')
assert.match(input, /walletQuota|quota|balance/i, 'input control logic must account for wallet balance')
assert.match(errors, /data\.error[\s\S]*message|error\.message/i, 'nested backend error messages must be preserved')
assert.match(controller, /playgroundWalletQuotaError|GetUserQuota/, 'controller must reject empty playground wallet quota')

console.log(JSON.stringify({ pass: true }))
