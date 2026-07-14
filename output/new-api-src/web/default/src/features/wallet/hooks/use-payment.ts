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
import i18next from 'i18next'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import {
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestStripePayment,
  isApiSuccess,
} from '../api'
import {
  closePaymentTab,
  openPaymentTab,
  isStripePayment,
  isWaffoPancakePayment,
  submitReturnedEpayForm,
} from '../lib'

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isPancake = isWaffoPancakePayment(paymentType)
        let response
        if (isStripe) {
          response = await calculateStripeAmount({ amount: topupAmount })
        } else if (isPancake) {
          response = await calculateWaffoPancakeAmount({ amount: topupAmount })
        } else {
          response = await calculateAmount({ amount: topupAmount })
        }

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = Number.parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      let paymentTab: ReturnType<typeof openPaymentTab> | null = null
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        paymentTab = isStripe ? null : openPaymentTab()
        const amount = Math.floor(topupAmount)

        const response = isStripe
          ? await requestStripePayment({
              amount,
              payment_method: 'stripe',
            })
          : await requestPayment({
              amount,
              payment_method: paymentType,
            })

        if (!isApiSuccess(response)) {
          closePaymentTab(paymentTab)
          toast.error(response.message || i18next.t('Payment request failed'))
          return false
        }

        // Handle Stripe payment
        if (isStripe && response.data?.pay_link) {
          window.open(response.data.pay_link as string, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        // Handle non-Stripe payment
        if (
          !isStripe &&
          'url' in response &&
          response.url &&
          response.data
        ) {
          // The tab is opened synchronously before the awaited API request;
          // submit the returned POST form into that exact tab. If the browser
          // blocked the popup, fall back to the current tab instead of leaving
          // the user with an unusable blank window.
          const target = paymentTab?.window ? paymentTab.target : '_self'
          submitReturnedEpayForm(response, target, paymentTab?.window)
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        closePaymentTab(paymentTab)
        return false
      } catch {
        closePaymentTab(paymentTab)
        toast.error(i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
