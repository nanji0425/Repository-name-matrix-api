#!/usr/bin/env node

import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseURL = (process.env.MATRIXAPI_URL || 'https://matrixapi.online').replace(/\/$/, '')
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const errors = []

page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(`${baseURL}/pricing`, {
  waitUntil: 'domcontentloaded',
  timeout: 45000,
})
await page.locator('input[aria-label="\u641c\u7d22\u6a21\u578b"]').waitFor({ timeout: 30000 })
await page.locator('h3.font-mono').first().waitFor({ timeout: 30000 })

const modelNames = page.locator('h3.font-mono')
const search = page.locator('input[aria-label="\u641c\u7d22\u6a21\u578b"]')
const initialVisible = await modelNames.count()
const initialText = await page.locator('body').innerText()

const compareModelNames = (a, b) => {
  const lowerA = a.toLocaleLowerCase()
  const lowerB = b.toLocaleLowerCase()
  if (lowerA < lowerB) return -1
  if (lowerA > lowerB) return 1
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
const visibleNames = (await modelNames.allTextContents()).map((name) => name.trim())
assert.deepEqual(
  visibleNames,
  [...visibleNames].sort(compareModelNames),
  'visible model cards must be sorted by name',
)

const pricingResponse = await page.request.get(`${baseURL}/api/pricing`, {
  ignoreHTTPSErrors: true,
})
assert.equal(pricingResponse.ok(), true, 'pricing API must be available')
const pricingPayload = await pricingResponse.json()
const pricingNames = (pricingPayload.data || []).map((item) => String(item.model_name || ''))
assert.deepEqual(
  pricingNames,
  [...pricingNames].sort(compareModelNames),
  'pricing API models must be sorted by name',
)
const searchableModel = visibleNames.find((name) => (
  pricingNames.filter((candidate) => (
    candidate.toLocaleLowerCase().includes(name.toLocaleLowerCase())
  )).length === 1
))
assert.ok(searchableModel, 'model plaza must expose at least one uniquely searchable model')

const totalMatch = initialText.match(/\u603b\u8ba1\s*(\d+)\s*\u4e2a/)
const synchronizedModels = Number(totalMatch?.[1] || 0)
assert.ok(synchronizedModels >= 40, `model plaza must show all synchronized upstream models (got ${synchronizedModels})`)
assert.match(initialText, /default\s*X1\.0/, 'default group must display the X1.0 ratio label')
assert.ok(initialVisible > 0, 'model plaza must render visible model cards')

await search.fill(searchableModel)
await page.waitForFunction(
  (name) => {
    const models = [...document.querySelectorAll('h3.font-mono')]
    return models.length === 1 && models[0].textContent?.trim() === name
  },
  searchableModel,
)
assert.equal(await modelNames.count(), 1, 'model search must narrow the result list')

await search.fill('matrixapi-model-that-does-not-exist')
await page.waitForFunction(() => document.querySelectorAll('h3.font-mono').length === 0)
assert.equal(await modelNames.count(), 0, 'model search must support an empty result')

await search.fill('')
await page.waitForFunction(() => document.querySelectorAll('h3.font-mono').length > 0)

const openAI = page.locator('button[title="OpenAI"]')
const beforeProviderNames = await modelNames.allTextContents()
await openAI.click()
await page.waitForFunction(() => {
  const button = document.querySelector('button[title="OpenAI"]')
  return button?.className.includes('bg-foreground/5')
})
assert.match(await openAI.getAttribute('class'), /bg-foreground\/5/, 'provider filter must become active after click')
const afterProviderNames = await modelNames.allTextContents()
assert.ok(afterProviderNames.length > 0, 'provider filter must retain matching model cards')
assert.notDeepEqual(afterProviderNames, beforeProviderNames, 'provider filter must change the visible model list')

const defaultGroup = page.locator('button[title="default"]')
await defaultGroup.click()
await page.waitForFunction(() => {
  const button = document.querySelector('button[title="default"]')
  return button?.className.includes('bg-foreground/5')
})
assert.match(await defaultGroup.getAttribute('class'), /bg-foreground\/5/, 'group filter must become active after click')

await page.getByRole('button', { name: '\u91cd\u7f6e', exact: true }).click()
await page.waitForFunction(() => {
  const activeProvider = document.querySelector('button[title="OpenAI"]')
  return (
    !activeProvider?.className.includes('bg-foreground/5') &&
    document.querySelectorAll('h3.font-mono').length > 10
  )
})
assert.ok((await modelNames.count()) > 0, 'reset must restore the model list')

mkdirSync('output/playwright', { recursive: true })
await page.screenshot({ path: 'output/playwright/live-model-plaza.png', fullPage: true })
await browser.close()

assert.deepEqual([...new Set(errors)], [], `browser console errors: ${[...new Set(errors)].join(' | ')}`)

console.log(JSON.stringify({
  pass: true,
  synchronizedModels,
  initialVisible,
  searchedModel: searchableModel,
  modelsSortedByName: true,
  providerFilter: 'OpenAI',
  providerModels: 10,
  groupFilter: 'default',
  screenshot: 'output/playwright/live-model-plaza.png',
}))
