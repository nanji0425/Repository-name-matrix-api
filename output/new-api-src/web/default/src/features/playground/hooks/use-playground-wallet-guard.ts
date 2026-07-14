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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getSelf } from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

import { hasPositiveWalletQuota, normalizeWalletQuota } from '../lib'

export const PLAYGROUND_RECHARGE_PATH = '/wallet'

type SelfResponse = {
  success?: boolean
  data?: {
    quota?: number | string | null
    [key: string]: unknown
  }
}

export function usePlaygroundWalletGuard() {
  const { t } = useTranslation()
  const [quota, setQuota] = useState<number | null>(() =>
    normalizeWalletQuota(useAuthStore.getState().auth.user?.quota)
  )
  const [isWalletLoading, setIsWalletLoading] = useState(true)
  const refreshRef = useRef<Promise<boolean> | null>(null)

  const refreshWalletBalance = useCallback(async (): Promise<boolean> => {
    if (refreshRef.current) {
      return refreshRef.current
    }

    const request = (async () => {
      setIsWalletLoading(true)

      try {
        const response = (await getSelf()) as SelfResponse
        const nextQuota = normalizeWalletQuota(response?.data?.quota)

        if (response?.success && response.data) {
          useAuthStore
            .getState()
            .auth.setUser(response.data as unknown as AuthUser)
        }

        setQuota(nextQuota)
        if (!hasPositiveWalletQuota(nextQuota)) {
          toast.error(t('Insufficient balance'))
          return false
        }

        return true
      } catch {
        setQuota(null)
        toast.error(t('Insufficient balance'))
        return false
      } finally {
        setIsWalletLoading(false)
        refreshRef.current = null
      }
    })()

    refreshRef.current = request
    return request
  }, [t])

  useEffect(() => {
    void refreshWalletBalance()
  }, [refreshWalletBalance])

  const isWalletBlocked =
    isWalletLoading || !hasPositiveWalletQuota(quota)

  return {
    quota,
    isWalletLoading,
    isWalletBlocked,
    rechargePath: PLAYGROUND_RECHARGE_PATH,
    ensureWalletBalance: refreshWalletBalance,
  }
}
