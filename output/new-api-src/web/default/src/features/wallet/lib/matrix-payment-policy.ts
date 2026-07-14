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
export type MatrixPaymentMethod = {
  name: string
  type: string
}

const MATRIX_ALIPAY_TYPE = 'alipay'

function isAlipayMethod(method: MatrixPaymentMethod): boolean {
  const type = method.type.trim().toLowerCase()
  const name = method.name.trim().toLowerCase()
  return (
    type === MATRIX_ALIPAY_TYPE ||
    name.includes('alipay') ||
    name.includes('支付宝')
  )
}

export function filterMatrixPaymentMethods(
  methods: readonly MatrixPaymentMethod[] | null | undefined
): MatrixPaymentMethod[] {
  if (!Array.isArray(methods)) return []

  return methods.filter(isAlipayMethod).map((method) => ({
    ...method,
    type: MATRIX_ALIPAY_TYPE,
  }))
}

export function getMatrixDefaultPaymentType(
  methods: readonly MatrixPaymentMethod[] | null | undefined
): string {
  return filterMatrixPaymentMethods(methods)[0]?.type ?? MATRIX_ALIPAY_TYPE
}
