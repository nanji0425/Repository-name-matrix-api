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
type EpayFormResponse = {
  url?: string
  data?: Record<string, unknown>
}

export type PaymentTab = {
  target: string
  window: Window | null
}

function createPaymentTarget(): string {
  return `matrixapi-payment-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isZPaySubmitURL(url: string): boolean {
  try {
    const parsed = new URL(url, document.baseURI)
    return (
      (parsed.hostname === 'zpayz.cn' || parsed.hostname === 'www.zpayz.cn') &&
      parsed.pathname.replace(/\/$/, '').toLowerCase() === '/submit.php'
    )
  } catch {
    return false
  }
}

/**
 * Open the payment tab synchronously while still inside the user's click
 * handler. The async payment API response is submitted into this named tab
 * afterwards, which avoids popup blocking and prevents an empty second tab.
 */
export function openPaymentTab(): PaymentTab {
  const target = createPaymentTarget()
  const paymentWindow =
    typeof window !== 'undefined' ? window.open('', target) : null
  return { target, window: paymentWindow }
}

export function closePaymentTab(paymentTab: PaymentTab | null): void {
  if (paymentTab?.window && !paymentTab.window.closed) {
    paymentTab.window.close()
  }
}

export function submitPaymentForm(
  url: string,
  params: Record<string, unknown>,
  target = '_blank',
  targetWindow?: Window | null
): void {
  // Keep the form in the opener document and target the synchronously opened
  // tab by name. Submitting a form owned by the popup document can abort the
  // cross-origin navigation and leave the popup at about:blank in Chromium.
  void targetWindow
  const ownerDocument = document

  if (targetWindow && isZPaySubmitURL(url)) {
    const navigationURL = new URL(url, ownerDocument.baseURI)
    Object.entries(params).forEach(([key, value]) => {
      navigationURL.searchParams.set(key, String(value))
    })
    targetWindow.location.href = navigationURL.toString()
    return
  }

  const form = ownerDocument.createElement('form')
  form.action = url
  form.method = 'POST'
  form.target = target

  Object.entries(params).forEach(([key, value]) => {
    const input = ownerDocument.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  })

  ownerDocument.body.appendChild(form)
  form.submit()
  ownerDocument.body.removeChild(form)
}

export function submitReturnedEpayForm(
  response: EpayFormResponse,
  target = '_blank',
  targetWindow?: Window | null
): boolean {
  if (!response.url || !response.data) return false
  submitPaymentForm(response.url, response.data, target, targetWindow)
  return true
}
