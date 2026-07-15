#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(
  resolve(
    import.meta.dirname,
    '../output/new-api-src/web/default/src/features/pricing/components/pricing-sidebar.tsx'
  ),
  'utf8'
)

assert.match(
  source,
  /Number\.isInteger\(ratio\)[\s\S]*?ratio\.toFixed\(1\)/,
  'integer group ratios must retain one decimal place',
)
assert.match(
  source,
  /return\s+`X\$\{formatted\}`/,
  'group ratio badges must use the requested uppercase X prefix',
)

console.log(JSON.stringify({ pass: true, defaultRatioLabel: 'X1.0' }))
