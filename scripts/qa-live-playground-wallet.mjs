#!/usr/bin/env node

import assert from 'node:assert/strict'
import { chromium } from 'playwright'

import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const errors = []
const requests = []

page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('request', (request) => {
  if (/\/api\/playground|\/v1\/(?:chat\/completions|responses)/.test(request.url())) {
    requests.push(request.url())
  }
})

const { userId } = await loginAndInstallAdmin(page, {
  locale: 'zh',
  theme: 'light',
})

await page.goto(`${baseURL}/playground`, {
  waitUntil: 'domcontentloaded',
  timeout: 45000,
})
const textarea = page.locator('textarea').first()
await textarea.waitFor({ timeout: 30000 })
await page.waitForFunction(() => {
  const input = document.querySelector('textarea')
  return input && !input.disabled
})
assert.equal(await textarea.isDisabled(), false, 'positive wallet balance must enable Playground input')

await page.route('**/api/user/self', async (route) => {
  const response = await route.fetch({
    headers: {
      ...route.request().headers(),
      'New-Api-User': userId,
    },
  })
  const body = await response.json()
  if (body?.data) body.data.quota = 0
  await route.fulfill({ response, json: body })
})

await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })
await textarea.waitFor({ timeout: 30000 })
await page.waitForFunction(() => document.querySelector('textarea')?.disabled === true)
assert.equal(await textarea.isDisabled(), true, 'zero wallet balance must disable Playground input')

await textarea.fill('This request must remain blocked').catch(() => {})
await page.keyboard.press('Enter')
await page.waitForTimeout(750)
assert.equal(requests.length, 0, 'zero wallet balance must not send a model request')

const bodyText = await page.locator('body').innerText()
assert.match(bodyText, /\u4f59\u989d\u4e0d\u8db3|\u5145\u503c|Insufficient balance|Recharge/i, 'zero balance state must explain how to recharge')

await browser.close()
assert.deepEqual([...new Set(errors)], [], `browser console errors: ${[...new Set(errors)].join(' | ')}`)

console.log(JSON.stringify({
  pass: true,
  positiveBalanceInputEnabled: true,
  zeroBalanceInputBlocked: true,
  modelRequestsWhileBlocked: requests.length,
}))
