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
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { AffiliateRewardsCard } from '@/features/wallet/components/affiliate-rewards-card'
import { TransferDialog } from '@/features/wallet/components/dialogs/transfer-dialog'
import { useAffiliate, useTopupInfo } from '@/features/wallet/hooks'
import type { UserWalletData } from '@/features/wallet/types'
import { getSelf } from '@/lib/api'

export function Referral() {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [transferOpen, setTransferOpen] = useState(false)
  const { topupInfo, loading: topupLoading } = useTopupInfo()
  const {
    affiliateLink,
    loading: affiliateLoading,
    transferring,
    transferQuota,
  } = useAffiliate()

  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch referral data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const handleTransfer = useCallback(
    async (amount: number) => {
      const success = await transferQuota(amount)
      if (success) await fetchUser()
      return success
    },
    [fetchUser, transferQuota]
  )

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Referral')}</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='mx-auto w-full max-w-7xl'>
            <AffiliateRewardsCard
              user={user}
              affiliateLink={affiliateLink}
              onTransfer={() => setTransferOpen(true)}
              complianceConfirmed={
                topupInfo?.payment_compliance_confirmed !== false
              }
              loading={userLoading || affiliateLoading || topupLoading}
            />
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />
    </>
  )
}
