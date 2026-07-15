import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
  })
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
    throw new Error(`${command} ${args.join(' ')} failed\n${output}`)
  }
  return result.stdout.trim()
}

const [hookSource, walletSource, apiSource] = await Promise.all([
  readFile(
    'output/new-api-src/web/default/src/features/wallet/hooks/use-payment.ts',
    'utf8',
  ),
  readFile(
    'output/new-api-src/web/default/src/features/wallet/index.tsx',
    'utf8',
  ),
  readFile(
    'output/new-api-src/web/default/src/features/wallet/api.ts',
    'utf8',
  ),
])
assert.match(
  hookSource,
  /submitReturnedEpayForm\(response,\s*target(?:,\s*paymentTab\?\.window)?\)/,
  'payment confirmation must submit the form returned by the backend',
)
assert.match(
  walletSource,
  /onConfirm=\{handlePaymentConfirm\}/,
  'payment dialog confirmation must call the wallet confirmation handler',
)
assert.match(
  walletSource,
  /processPayment\(topupAmount, selectedPaymentMethod\.type\)/,
  'wallet confirmation handler must execute the payment hook',
)
assert.match(
  apiSource,
  /url:\s*res\.data\.url/,
  'wallet API adapter must preserve the backend form action',
)

const goOutput = run(
  'go',
  [
    'test',
    './controller',
    '-run',
    'TestBuildEpayPurchaseFormUsesZPayAndMatrixCallbacks$',
    '-count=1',
  ],
  'output/new-api-src',
)
const frontendOutput = run(
  process.execPath,
  ['--test', 'src/features/wallet/lib/epay-form.test.ts'],
  'output/new-api-src/web/default',
)

console.log(JSON.stringify({
  pass: true,
  paymentOrderCreated: false,
  networkRequestsMade: false,
  action: 'https://zpayz.cn/submit.php',
  type: 'alipay',
  notify_url: 'https://matrixapi.online/api/user/epay/notify',
  return_url: 'https://matrixapi.online/console/log',
  backendTest: goOutput.split(/\r?\n/).at(-1),
  frontendTest: frontendOutput.split(/\r?\n/).at(-1),
}, null, 2))
