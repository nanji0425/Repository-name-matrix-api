import assert from 'node:assert/strict';
import {
  buildZpayPaymentUrl,
  signZpayParams,
  verifyZpaySignature,
} from './zpay';

const merchantKey = 'test-secret';

const signedParams = {
  pid: '1001',
  type: 'alipay',
  out_trade_no: 'RE123',
  notify_url: 'https://api.example.com/wallet/zpay/notify',
  return_url: 'https://app.example.com/dashboard/balance',
  name: 'MatrixAPI recharge RE123',
  money: '25.50',
};

const expectedSign = '3d256bad9b7ecb3f5c2e6e6b564e4ac3';

assert.equal(signZpayParams(signedParams, merchantKey), expectedSign);
assert.equal(
  verifyZpaySignature({ ...signedParams, sign: expectedSign, sign_type: 'MD5' }, merchantKey),
  true,
);
assert.equal(
  verifyZpaySignature({ ...signedParams, money: '25.51', sign: expectedSign, sign_type: 'MD5' }, merchantKey),
  false,
);

const paymentUrl = buildZpayPaymentUrl('https://zpayz.cn/', {
  ...signedParams,
  sign: expectedSign,
  sign_type: 'MD5',
});

assert.equal(paymentUrl.startsWith('https://zpayz.cn/submit.php?'), true);
assert.equal(paymentUrl.includes('pid=1001'), true);
assert.equal(paymentUrl.includes(`sign=${expectedSign}`), true);

console.log('zpay signature tests passed');
