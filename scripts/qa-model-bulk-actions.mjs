#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const bulkActions = read(
  'output/new-api-src/web/default/src/features/models/components/data-table-bulk-actions.tsx',
)
const modelActions = read(
  'output/new-api-src/web/default/src/features/models/lib/model-actions.ts',
)

assert.match(
  modelActions,
  /export\s+async\s+function\s+handleBatchUpdateModelFields/,
  'model actions must expose a reusable batch field update helper',
)
assert.match(
  modelActions,
  /updateModel\(\s*\{\s*\.\.\.model\s*,\s*id:\s*model\.id\s*,\s*\.\.\.fields\s*\}\s*\)/s,
  'batch field update must preserve the existing model payload while overriding selected fields',
)
assert.match(
  bulkActions,
  /Batch edit selected models/,
  'bulk toolbar must include a batch edit entry point',
)
assert.match(
  bulkActions,
  /Apply to selected models/,
  'bulk edit dialog must expose an apply action',
)
assert.match(
  bulkActions,
  /name='vendor_id'|name="vendor_id"|setSelectedVendorId/,
  'bulk edit dialog must allow setting provider/vendor',
)
assert.match(
  bulkActions,
  /TagInput/,
  'bulk edit dialog must allow setting tags with the shared TagInput control',
)

console.log(JSON.stringify({ pass: true }))
