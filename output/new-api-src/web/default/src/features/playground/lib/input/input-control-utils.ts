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
import type { GroupOption, ModelOption } from '../../types'
import { hasPositiveWalletQuota } from '../wallet-guard-utils'

type InputControlStateOptions = {
  disabled?: boolean
  groups: GroupOption[]
  hasStopHandler: boolean
  isGenerating?: boolean
  isModelLoading?: boolean
  models: ModelOption[]
  text: string
  walletQuota?: number | null
}

type InputControlState = {
  canSubmit: boolean
  isSelectorDisabled: boolean
  shouldShowStop: boolean
}

type SubmittableInputMessage = {
  text?: string | null
}

export function getSubmittableInputText(
  message: SubmittableInputMessage,
  disabled?: boolean,
  walletQuota?: number | null
): string | null {
  const walletReady =
    walletQuota !== undefined && hasPositiveWalletQuota(walletQuota)

  if (
    disabled ||
    !message.text?.trim() ||
    !walletReady
  ) {
    return null
  }

  return message.text
}

export function getInputControlState({
  disabled,
  groups,
  hasStopHandler,
  isGenerating,
  isModelLoading,
  models,
  text,
  walletQuota,
}: InputControlStateOptions): InputControlState {
  const hasModels = models.length > 0
  const walletReady =
    walletQuota !== undefined && hasPositiveWalletQuota(walletQuota)

  return {
    canSubmit:
      !disabled && walletReady && hasModels && text.trim().length > 0,
    isSelectorDisabled: disabled || isModelLoading || groups.length === 0,
    shouldShowStop: Boolean(isGenerating && hasStopHandler),
  }
}
