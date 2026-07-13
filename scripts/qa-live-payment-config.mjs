#!/usr/bin/env node

import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

import { baseURL, loginAndInstallAdmin } from './qa-helpers.mjs'

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

const { userId } = await loginAndInstallAdmin(page, {
  locale: 'zh',
  theme: 'light',
})

const response = await page.request.get(`${baseURL}/api/user/topup/info`, {
  headers: { 'New-Api-User': userId },
  ignoreHTTPSErrors: true,
})
const topup = await response.json()
assert.equal(response.ok(), true, 'top-up configuration endpoint must be available')
assert.equal(topup.success, true, 'top-up configuration endpoint must return success')
assert.deepEqual(
  topup.data?.pay_methods?.map((method) => method.type),
  ['alipay'],
  'Alipay must be the only enabled payment method',
)
assert.equal(topup.data?.enable_online_topup, true, 'online top-up must be enabled')
assert.equal(topup.data?.enable_stripe_topup, false, 'Stripe must be disabled')
assert.equal(topup.data?.enable_waffo_topup, false, 'Waffo must be disabled')
assert.equal(topup.data?.enable_waffo_pancake_topup, false, 'Waffo Pancake must be disabled')

await page.goto(`${baseURL}/wallet`, {
  waitUntil: 'domcontentloaded',
  timeout: 45000,
})
await page.waitForFunction(() => /Alipay/i.test(document.body.innerText))
const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ')

assert.match(text, /Alipay/i, 'wallet must show Alipay')
assert.match(text, /10\s+Pay\s+10/, 'wallet must show the 10-to-10 top-up package')
assert.match(text, /20\s+Pay\s+20/, 'wallet must show the 20-to-20 top-up package')
assert.match(text, /100\s+Pay\s+100/, 'wallet must show the 100-to-100 top-up package')
assert.doesNotMatch(text, /WeChat|Stripe|USDT|\u5fae\u4fe1/i, 'wallet must not show unsupported payment methods')

await page.getByRole('button', { name: 'Alipay', exact: true }).click()
const paymentDialog = page.locator('[role="alertdialog"], [role="dialog"]').last()
await paymentDialog.waitFor({ timeout: 15000 })
const dialogText = (await paymentDialog.innerText()).replace(/\s+/g, ' ')
assert.match(dialogText, /\u786e\u8ba4|Confirm Payment/i, 'selecting Alipay must open a confirmation dialog')
assert.match(dialogText, /Alipay/i, 'payment confirmation must retain the Alipay method')
assert.doesNotMatch(dialogText, /WeChat|Stripe|USDT|\u5fae\u4fe1/i, 'payment confirmation must not show unsupported methods')
assert.ok(
  await paymentDialog.getByRole('button', { name: /\u786e\u8ba4|Confirm Payment/i }).count(),
  'payment confirmation must expose the final confirmation action',
)

mkdirSync('output/playwright', { recursive: true })
await page.screenshot({ path: 'output/playwright/live-wallet.png', fullPage: true })
await browser.close()

assert.deepEqual([...new Set(errors)], [], `browser console errors: ${[...new Set(errors)].join(' | ')}`)

console.log(JSON.stringify({
  pass: true,
  paymentMethods: ['alipay'],
  onlineTopup: true,
  packages: ['10/10', '20/20', '100/100'],
  confirmationDialog: true,
  paymentOrderCreated: false,
  screenshot: 'output/playwright/live-wallet.png',
}))
