#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const configs = [
  'nginx/nginx.conf',
  'nginx/conf.d/ssl.conf',
  'nginx/ssl.conf.template',
]

const legacyConsoleRedirects = {
  '/console': '/dashboard/overview',
  '/console/': '/dashboard/overview',
  '/console/overview': '/dashboard/overview',
  '/console/token': '/keys',
  '/console/log': '/usage-logs/common',
  '/console/task': '/usage-logs/task',
  '/console/topup': '/wallet',
  '/console/subscription': '/wallet',
  '/console/personal': '/profile',
  '/console/models': '/models/metadata',
  '/console/channel': '/channels',
  '/console/redemption': '/redemption-codes',
  '/console/setting': '/system-settings/site',
  '/console/user': '/users',
  '/console/deployment': '/models/deployments',
}

const legacyDashboardRedirects = {
  '/dashboard/topup': '/wallet',
  '/dashboard/topup/': '/wallet',
  '/dashboard/token': '/keys',
  '/dashboard/log': '/usage-logs/common',
  '/dashboard/task': '/usage-logs/task',
  '/dashboard/subscription': '/wallet',
  '/dashboard/personal': '/profile',
  '/dashboard/models': '/models/metadata',
  '/dashboard/channel': '/channels',
  '/dashboard/redemption': '/redemption-codes',
  '/dashboard/setting': '/system-settings/site',
  '/dashboard/user': '/users',
  '/dashboard/deployment': '/models/deployments',
}

function exactRouteBlocks(source, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return Array.from(
    source.matchAll(
      new RegExp(`location\\s*=\\s*${escaped}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, 'g'),
    ),
    (match) => match[1],
  )
}

for (const relativePath of configs) {
  const source = readFileSync(resolve(root, relativePath), 'utf8')
  const blocks = exactRouteBlocks(source, '/')

  assert.ok(blocks.length > 0, `${relativePath} must define an exact root route`)
  for (const block of blocks) {
    assert.match(
      block,
      /proxy_pass\s+http:\/\/new_api\s*;/,
      `${relativePath} must serve the New API homepage at /`,
    )
    assert.doesNotMatch(
      block,
      /matrix-site|try_files\s+\/index\.html/,
      `${relativePath} must not serve the retired static homepage at /`,
    )
  }

  const pricingBlocks = exactRouteBlocks(source, '/pricing')
  assert.ok(
    pricingBlocks.length > 0,
    `${relativePath} must define an exact pricing route`,
  )
  for (const block of pricingBlocks) {
    assert.match(
      block,
      /proxy_pass\s+http:\/\/new_api\s*;/,
      `${relativePath} must serve the interactive New API model square at /pricing`,
    )
    assert.doesNotMatch(
      block,
      /matrix-site|try_files\s+\/pricing\.html/,
      `${relativePath} must not serve the retired static model square at /pricing`,
    )
  }

  for (const route of ['/keys', '/profile', '/channels', '/models', '/models/metadata', '/system-settings', '/system-settings/site']) {
    const blocks = exactRouteBlocks(source, route)
    for (const block of blocks) {
      assert.doesNotMatch(
        block,
        /return\s+30[1278]\s+\/(?:console|pricing)/,
        `${relativePath} must not redirect native administration route ${route} to the retired console`,
      )
    }
  }

  for (const [route, destination] of Object.entries(legacyConsoleRedirects)) {
    const blocks = exactRouteBlocks(source, route)
    assert.ok(
      blocks.length > 0,
      `${relativePath} must define a legacy redirect for ${route}`,
    )
    const escapedDestination = destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const block of blocks) {
      assert.match(
        block,
        new RegExp(`return\\s+30[1278]\\s+${escapedDestination}\\s*;`),
        `${relativePath} must redirect ${route} to ${destination}`,
      )
      assert.doesNotMatch(
        block,
        /proxy_pass\s+http:\/\/new_api/,
        `${relativePath} must not proxy retired console route ${route}`,
      )
    }
  }

  for (const route of ['/dashboard', '/dashboard/']) {
    const blocks = exactRouteBlocks(source, route)
    assert.ok(blocks.length > 0, `${relativePath} must define ${route}`)
    for (const block of blocks) {
      assert.match(
        block,
        /return\s+30[1278]\s+\/dashboard\/overview\s*;/,
        `${relativePath} must keep ${route} on the native dashboard`,
      )
    }
  }


  for (const [route, destination] of Object.entries(legacyDashboardRedirects)) {
    const blocks = exactRouteBlocks(source, route)
    assert.ok(
      blocks.length > 0,
      `${relativePath} must define a legacy dashboard redirect for ${route}`,
    )
    const escapedDestination = destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const block of blocks) {
      assert.match(
        block,
        new RegExp(`return\\s+30[1278]\\s+${escapedDestination}\\s*;`),
        `${relativePath} must redirect ${route} to ${destination}`,
      )
    }
  }

  assert.doesNotMatch(
    source,
    /return\s+30[1278]\s+\/console(?:[\/;]|\s)/,
    `${relativePath} must not redirect native routes back to the retired console`,
  )
  assert.doesNotMatch(
    source,
    /location\s+\/dashboard\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/new_api\/console\//,
    `${relativePath} must not rewrite native dashboard paths to retired console paths`,
  )
}

console.log(JSON.stringify({ pass: true, configs }))
