#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = readFileSync(resolve(root, 'nginx/site/brand-init.js'), 'utf8')

assert.match(
  source,
  /NATIVE_APP_ROUTE_PATTERN/,
  'brand injection must distinguish native React routes from static pages'
)
assert.match(
  source,
  /pricing\|sign-up\|dashboard\|keys\|usage-logs\|wallet/,
  'native React route guard must include the wallet page'
)
assert.match(
  source,
  /isNativeReactRoute\(\)/,
  'brand injection must expose a native React route guard'
)
const nativeGuardIndex = source.indexOf(
  'if (isNativeReactRoute()) return;'
)
const bodyRewriteIndex = source.indexOf(
  'document.createTreeWalker(document.body'
)
assert.ok(
  nativeGuardIndex >= 0 &&
    bodyRewriteIndex > nativeGuardIndex,
  'body text rewriting must be guarded away from native React routes'
)
assert.match(
  source,
  /if \(isNativeReactRoute\(\)\) \{\s*applyBrandSafety\(\);\s*return;\s*\}/,
  'native React boot must not install the static-page mutation observer'
)
assert.match(
  source,
  /MutationObserver/,
  'static pages must retain mutation-based branding for late-rendered content'
)

console.log(JSON.stringify({ pass: true }))
