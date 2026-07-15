#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs'

const root = new URL('..', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

const sourceChecks = await Promise.all([
  read('output/new-api-src/web/default/src/features/channels/lib/channel-test-utils.ts'),
  read('output/new-api-src/web/default/src/features/channels/lib/channel-test-utils.test.ts'),
  read('output/new-api-src/web/default/src/features/models/lib/model-form.ts'),
  read('output/new-api-src/web/default/src/features/models/lib/model-form.test.ts'),
  read('output/new-api-src/web/default/src/features/models/components/description-cell.tsx'),
  read('output/new-api-src/web/default/src/features/models/components/dialogs/description-dialog.tsx'),
  read('output/new-api-src/web/default/src/features/models/components/drawers/model-mutate-drawer.tsx'),
])

const [channelUtils, channelTests, modelForm, modelTests, descriptionCell, descriptionDialog, modelDrawer] = sourceChecks
assert.match(channelUtils, /normalizeChannelTestResponse/)
assert.match(channelUtils, /upstreamStatus/)
assert.match(channelUtils, /Network error while testing channel/)
assert.match(channelTests, /nested upstream errors/)
assert.match(channelTests, /only successful tests refresh/)
assert.match(modelForm, /description: z\.string\(\)/)
assert.match(modelForm, /description: formData\.description\?\.trim\(\) \|\| ''/)
assert.match(modelTests, /loads the existing description/)
assert.match(descriptionCell, /No description set|Not set/)
assert.match(descriptionDialog, /No description set/)
assert.match(modelDrawer, /description: values\.description\.trim\(\)/)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
})
const consoleErrors = []
page.on('pageerror', (error) => consoleErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

await loginAndInstallAdmin(page, { locale: 'en', theme: 'light' })
const pages = []
for (const route of ['/channels', '/models/metadata']) {
  const response = await page.goto(`${baseURL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  await page.waitForTimeout(5000)
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
  pages.push({ route, url: page.url(), status: response?.status() || 0, bodyLength: text.length })
  assert.ok(response && response.status() < 400, `${route} returned HTTP ${response?.status()}`)
  assert.ok(text.length > 140, `${route} rendered an unexpectedly small page`)
  assert.doesNotMatch(text, /Page Not Found|404|页面未找到/i, `${route} rendered a 404 page`)
}

await browser.close()
assert.deepEqual([...new Set(consoleErrors)], [], `browser console errors: ${[...new Set(consoleErrors)].join(' | ')}`)

console.log(JSON.stringify({ pass: true, pages, consoleErrors: [] }))
