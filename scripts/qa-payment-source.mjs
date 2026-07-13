import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const read = (path) => readFile(path, 'utf8')

const [bootstrap, dbBootstrap, topup, paymentFlow, paymentHook, subscriptionDialog, epayFormTest, paymentURLTest, classicTopup, classicSubscription] = await Promise.all([
  read('scripts/bootstrap-new-api.mjs'),
  read('scripts/bootstrap-new-api-db.sh'),
  read('output/new-api-src/controller/topup.go'),
  read('scripts/qa-payment-flow.mjs'),
  read('output/new-api-src/web/default/src/features/wallet/hooks/use-payment.ts'),
  read('output/new-api-src/web/default/src/features/subscriptions/components/dialogs/subscription-purchase-dialog.tsx'),
  read('output/new-api-src/web/default/src/features/wallet/lib/epay-form.test.ts'),
  read('output/new-api-src/controller/payment_urls_test.go'),
  read('output/new-api-src/web/classic/src/components/topup/index.jsx'),
  read('output/new-api-src/web/classic/src/components/topup/SubscriptionPlansCard.jsx'),
])

assert.match(bootstrap, /https:\/\/zpayz\.cn\//, 'bootstrap must use the ZPay base URL')
assert.match(bootstrap, /ServerAddress/, 'bootstrap must persist the public callback base')
assert.match(bootstrap, /QuotaForNewUser[^\n]*500000/, 'bootstrap must grant one USD to new users')
assert.match(dbBootstrap, /ServerAddress/, 'DB bootstrap must persist the public callback base')
assert.match(dbBootstrap, /QuotaForNewUser[^\n]*500000/, 'DB bootstrap must grant one USD to new users')
assert.match(topup, /normalizeEpayBaseURL/, 'runtime Epay client must normalize the gateway base')
assert.match(topup, /buildEpayPaymentURLs/, 'runtime Epay requests must use shared callback URL generation')
assert.match(topup, /buildEpayPurchaseForm/, 'runtime Epay requests must use the tested form builder')
assert.match(paymentFlow, /notifyUrl|notify_url/, 'payment QA must assert the notify URL')
assert.match(paymentFlow, /returnUrl|return_url/, 'payment QA must assert the return URL')
assert.doesNotMatch(paymentFlow, /\/api\/user\/pay|page\.request|requestJsonWithRetry/, 'payment QA must not create a live payment order')
assert.match(paymentHook, /submitReturnedEpayForm\(response,\s*target(?:,\s*paymentTab\?\.window)?\)/, 'payment hook must submit the returned backend form into the prepared tab')
assert.match(epayFormTest, /openPaymentTab/, 'default Epay regression test must cover synchronous payment-tab opening')
assert.match(epayFormTest, /submittedForm\.target,\s*paymentTab\.target/, 'default Epay regression test must submit into the named payment tab')
assert.match(subscriptionDialog, /submitPaymentForm\([\s\S]*res\.url[\s\S]*res\.data \|\| \{\}/, 'subscription Epay must reuse the named-tab form submitter')
assert.match(subscriptionDialog, /openPaymentTab\(\)/, 'subscription Epay must open a named payment tab during the click')
assert.match(classicTopup, /openPaymentTab\(\)/, 'classic wallet Epay must open a named payment tab during the click')
assert.match(classicSubscription, /openPaymentTab\(\)/, 'classic subscription Epay must open a named payment tab during the click')
assert.match(classicTopup, /ownerDocument\.createElement\('input'\)/, 'classic wallet Epay inputs must belong to the submitted form document')
assert.match(classicSubscription, /ownerDocument\.createElement\('input'\)/, 'classic subscription Epay inputs must belong to the submitted form document')
assert.match(epayFormTest, /document[\s\S]*submit/, 'frontend payment test must exercise DOM form submission')
assert.match(paymentURLTest, /https:\/\/zpayz\.cn\/submit\.php/, 'backend contract test must assert the ZPay action')

console.log(JSON.stringify({ pass: true }))
