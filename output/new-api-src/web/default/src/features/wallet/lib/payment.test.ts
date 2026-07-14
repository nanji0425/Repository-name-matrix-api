/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const policyUrl = new URL('./matrix-payment-policy.ts', import.meta.url)

if (!existsSync(fileURLToPath(policyUrl))) {
  test('MatrixAPI payment policy module exists', () => {
    assert.fail('matrix-payment-policy.ts is missing')
  })
} else {
  const { filterMatrixPaymentMethods, getMatrixDefaultPaymentType } =
    await import(policyUrl.href)

  describe('MatrixAPI payment policy', () => {
    test('keeps only Alipay methods', () => {
      const methods = [
        { name: 'Alipay', type: 'alipay' },
        { name: 'Stripe', type: 'stripe' },
        { name: 'WeChat Pay', type: 'wechat' },
      ]

      assert.deepEqual(filterMatrixPaymentMethods(methods), [
        { name: 'Alipay', type: 'alipay' },
      ])
    })

    test('normalizes an Alipay-labelled epay method', () => {
      const methods = [
        { name: '支付宝', type: 'epay' },
        { name: 'Bank card', type: 'card' },
      ]

      assert.deepEqual(filterMatrixPaymentMethods(methods), [
        { name: '支付宝', type: 'alipay' },
      ])
    })

    test('uses Alipay when upstream exposes no allowed method', () => {
      assert.equal(
        getMatrixDefaultPaymentType([
          { name: 'Stripe', type: 'stripe' },
          { name: 'WeChat Pay', type: 'wechat' },
        ]),
        'alipay'
      )
    })
  })
}
