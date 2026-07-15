import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { UpstreamRatioSync } from '@/features/system-settings/models/upstream-ratio-sync'

type UpstreamSyncDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRICE_OPTION_KEYS = [
  'ModelPrice',
  'ModelRatio',
  'CompletionRatio',
  'CacheRatio',
  'CreateCacheRatio',
  'ImageRatio',
  'AudioRatio',
  'AudioCompletionRatio',
  'billing_setting.billing_mode',
  'billing_setting.billing_expr',
] as const

export function UpstreamSyncDialog({
  open,
  onOpenChange,
}: UpstreamSyncDialogProps) {
  const { t } = useTranslation()
  const { data } = useSystemOptions()
  const optionMap = useMemo(
    () => new Map((data?.data || []).map((option) => [option.key, option.value])),
    [data?.data]
  )
  const modelRatios = useMemo(
    () =>
      Object.fromEntries(
        PRICE_OPTION_KEYS.map((key) => [key, optionMap.get(key) || '{}'])
      ) as Record<(typeof PRICE_OPTION_KEYS)[number], string>,
    [optionMap]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-[min(96vw,1400px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('Upstream price sync')}</DialogTitle>
          <DialogDescription>
            {t(
              'Select upstream channels, apply a percentage markup to their base prices, and choose which values become the model prices.'
            )}
          </DialogDescription>
        </DialogHeader>
        <UpstreamRatioSync modelRatios={modelRatios} />
      </DialogContent>
    </Dialog>
  )
}
