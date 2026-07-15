#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = readFileSync(resolve(root, 'nginx/site/pricing.html'), 'utf8')

assert.match(source, /catalog-search[\s\S]*input[^>]*type=["']search/i, 'model plaza must expose a search input')
assert.match(source, /catalog-model[\s\S]*\.hidden|card\.hidden|hidden\s*=/i, 'model plaza must hide non-matching cards')
assert.match(source, /filter-pill[\s\S]*addEventListener\(['"]click['"]/i, 'model category pills must handle clicks')
assert.match(source, /filter-reset[\s\S]*addEventListener\(['"]click['"]/i, 'model filters must provide a working reset action')
assert.match(source, /copy-button[\s\S]*clipboard|writeText/i, 'model copy actions must have a browser behavior')

console.log(JSON.stringify({ pass: true }))
