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
const paymentRequests = []
const browserErrors = []
page.on('pageerror', (error) => browserErrors.push(`pageerror:${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(`console:${message.text()}`)
})
page.on('request', (request) => {
  if (request.url().includes('/api/user/pay')) {
    console.log(JSON.stringify({ apiRequest: request.url(), method: request.method() }))
  }
})
page.on('response', async (response) => {
  if (response.url().includes('/api/user/pay')) {
    console.log(JSON.stringify({ apiStatus: response.status(), apiUrl: response.url() }))
  }
})

const { userId } = await loginAndInstallAdmin(page, { locale: 'zh', theme: 'light' })

await context.route('https://zpayz.cn/submit.php**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>ZPay mock checkout</title><p>Mock QR checkout</p>',
  })
})

await page.goto(`${baseURL}/wallet`, { waitUntil: 'commit', timeout: 45000 })
await page.waitForFunction(() => /Alipay/i.test(document.body?.innerText || ''), null, { timeout: 180000 }).catch(async (error) => {
  console.log(JSON.stringify({ body: (await page.locator('body').innerText().catch(() => '')).slice(0, 500), browserErrors }))
  throw error
})

await page.unroute('**/api/**')
await page.route('**/api/**', async (route) => {
  if (route.request().url().endsWith('/api/user/pay')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'success',
        url: 'https://zpayz.cn/submit.php',
        data: {
          type: 'alipay',
          notify_url: 'https://matrixapi.online/api/user/epay/notify',
          return_url: 'https://matrixapi.online/console/log',
          out_trade_no: 'POPUP-QA-NO-ORDER',
          sign: 'popup-qa-signature',
        },
      }),
    })
    return
  }
  await route.continue({
    headers: {
      ...route.request().headers(),
      'New-Api-User': userId,
    },
  })
})

await page.getByRole('button', { name: 'Alipay', exact: true }).click()
const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last()
await dialog.waitFor({ timeout: 15000 })

const popupPromise = page.waitForEvent('popup', { timeout: 15000 })
const zpayRequestPromise = context.waitForEvent('request', {
  predicate: (request) => request.url().startsWith('https://zpayz.cn/submit.php'),
  timeout: 15000,
})
await dialog.getByRole('button', { name: /确认|Confirm Payment/i }).click()
const popup = await popupPromise
const zpayRequest = await zpayRequestPromise
await popup.waitForURL(/https:\/\/zpayz\.cn\/submit\.php\?/, { timeout: 15000 })
await popup.waitForLoadState('domcontentloaded')
paymentRequests.push({ method: zpayRequest.method(), url: zpayRequest.url() })

assert.match(popup.url(), /^https:\/\/zpayz\.cn\/submit\.php\?/)
assert.equal(paymentRequests.length, 1)
assert.equal(paymentRequests[0].method, 'GET')
assert.match(paymentRequests[0].url, /[?&]type=alipay(?:&|$)/)
assert.match(paymentRequests[0].url, /notify_url=https%3A%2F%2Fmatrixapi\.online%2Fapi%2Fuser%2Fepay%2Fnotify/)
assert.match(paymentRequests[0].url, /return_url=https%3A%2F%2Fmatrixapi\.online%2Fconsole%2Flog/)
assert.equal(context.pages().length, 2)

await popup.close()
await browser.close()

console.log(JSON.stringify({
  pass: true,
  popupPages: 2,
  method: paymentRequests[0].method,
  action: 'https://zpayz.cn/submit.php',
  type: 'alipay',
  paymentOrderCreated: false,
}))
