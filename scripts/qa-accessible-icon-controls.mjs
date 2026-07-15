#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

assert.match(
  read('output/new-api-src/web/default/src/components/data-table/toolbar/view-mode-toggle.tsx'),
  /aria-label=\{segment\.tooltip\}/,
  'data-table view mode buttons need accessible labels',
)
assert.match(
  read('output/new-api-src/web/default/src/features/pricing/components/pricing-toolbar.tsx'),
  /aria-label=\{option\.tooltip \|\| option\.label\}/,
  'pricing view mode buttons need accessible labels',
)
for (const path of [
  'output/new-api-src/web/default/src/features/models/components/models-primary-buttons.tsx',
  'output/new-api-src/web/default/src/features/channels/components/channels-primary-buttons.tsx',
]) {
  assert.match(read(path), /aria-label=\{t\('More actions'\)\}/, `${path} needs a labelled more-actions button`)
}

console.log(JSON.stringify({ pass: true }))
