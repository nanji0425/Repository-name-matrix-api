#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const sidebar = read('output/new-api-src/web/default/src/hooks/use-sidebar-data.ts')
const sidebarConfig = read('output/new-api-src/web/default/src/hooks/use-sidebar-config.ts')
const settingsDefaults = read('output/new-api-src/web/default/src/features/system-settings/maintenance/config.ts')
const keysActions = read('output/new-api-src/web/default/src/features/keys/components/data-table-row-actions.tsx')
const playground = read('output/new-api-src/web/default/src/features/playground/index.tsx')
const conversation = read('output/new-api-src/web/default/src/features/playground/hooks/use-playground-conversation.ts')
const input = read('output/new-api-src/web/default/src/features/playground/components/input/playground-input.tsx')
const inputUtils = read('output/new-api-src/web/default/src/features/playground/lib/input/input-control-utils.ts')
const errors = read('output/new-api-src/web/default/src/features/playground/lib/streaming/request-error-utils.ts')
const controller = read('output/new-api-src/controller/playground.go')

assert.doesNotMatch(sidebar, /type:\s*['"]chat-presets['"]/, 'sidebar must not render the secondary Chat row')
assert.match(sidebarConfig, /chat:\s*\{[\s\S]*?chat:\s*false/, 'sidebar fallback must hide the secondary Chat row')
assert.match(settingsDefaults, /chat:\s*\{[\s\S]*?chat:\s*false/, 'system settings reset defaults must hide the secondary Chat row')
assert.match(keysActions, /navigate\(\{\s*to:\s*['"]\/playground['"]\s*\}\)/, 'API key Chat action must navigate to the local Playground')
assert.doesNotMatch(keysActions, /handleOpenChatPreset|resolveChatUrl|useChatPresets/, 'API key Chat action must not use external chat presets')
assert.match(playground, /quota|balance|余额|recharge|wallet/i, 'Playground must expose a wallet-balance guard')
assert.match(conversation, /quota|balance|余额|recharge|wallet/i, 'conversation send/retry/edit paths must share wallet guard state')
assert.match(input, /disabled|quota|balance|余额/i, 'Playground input must disable when wallet state blocks sending')
assert.match(inputUtils, /quota|balance|余额/i, 'input control logic must account for wallet balance')
assert.match(errors, /data\.error|error\.message|余额|balance/i, 'Playground error parsing must preserve nested backend messages')
assert.match(controller, /Quota|quota|余额/i, 'Playground backend must enforce wallet quota before billing')

console.log(JSON.stringify({ pass: true }))
