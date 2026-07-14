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
import { useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Copy, PencilLine, Power, PowerOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { Dialog } from '@/components/dialog'
import { TagInput } from '@/components/tag-input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { copyToClipboard } from '@/lib/copy-to-clipboard'

import {
  handleBatchEnableModels,
  handleBatchDisableModels,
  handleBatchDeleteModels,
  handleBatchUpdateModelFields,
} from '../lib'
import type { Model, Vendor } from '../types'

interface DataTableBulkActionsProps<TData> {
  table: Table<TData>
  vendors: Vendor[]
}

const BULK_VENDOR_UNCHANGED = '__unchanged__'

export function DataTableBulkActions<TData>({
  table,
  vendors,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState(
    BULK_VENDOR_UNCHANGED
  )
  const [replaceTags, setReplaceTags] = useState(false)
  const [batchTags, setBatchTags] = useState<string[]>([])

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.reduce<number[]>((ids, row) => {
    const id = (row.original as Model).id

    if (typeof id === 'number') {
      ids.push(id)
    }

    return ids
  }, [])

  const selectedModels = selectedRows.map((row) => row.original as Model)

  const handleClearSelection = () => {
    table.resetRowSelection()
  }

  const handleEnableAll = () => {
    handleBatchEnableModels(selectedIds, queryClient, handleClearSelection)
  }

  const handleDisableAll = () => {
    handleBatchDisableModels(selectedIds, queryClient, handleClearSelection)
  }

  const handleDeleteAll = () => {
    handleBatchDeleteModels(selectedIds, queryClient, () => {
      setShowDeleteConfirm(false)
      handleClearSelection()
    })
  }

  const handleOpenBatchEdit = () => {
    setSelectedVendorId(BULK_VENDOR_UNCHANGED)
    setReplaceTags(false)
    setBatchTags([])
    setShowBatchEdit(true)
  }

  const handleApplyBatchEdit = () => {
    const fields: Partial<Pick<Model, 'vendor_id' | 'tags'>> = {}

    if (selectedVendorId !== BULK_VENDOR_UNCHANGED) {
      const vendorId = Number.parseInt(selectedVendorId, 10)
      if (Number.isFinite(vendorId)) {
        fields.vendor_id = vendorId
      }
    }

    if (replaceTags) {
      fields.tags = batchTags.join(',')
    }

    handleBatchUpdateModelFields(selectedModels, fields, queryClient, () => {
      setShowBatchEdit(false)
      handleClearSelection()
    })
  }

  const handleCopyNames = async () => {
    const names = selectedModels.map((m) => m.model_name).join(',')
    const success = await copyToClipboard(names)
    if (success) {
      toast.success(t('Model names copied to clipboard'))
    } else {
      toast.error(t('Failed to copy model names'))
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='model'>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={handleEnableAll}
                className='size-8'
                aria-label={t('Enable selected models')}
                title={t('Enable selected models')}
              />
            }
          >
            <Power />
            <span className='sr-only'>{t('Enable selected models')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Enable selected models')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={handleOpenBatchEdit}
                className='size-8'
                aria-label={t('Batch edit selected models')}
                title={t('Batch edit selected models')}
              />
            }
          >
            <PencilLine />
            <span className='sr-only'>{t('Batch edit selected models')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Batch edit selected models')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={handleDisableAll}
                className='size-8'
                aria-label={t('Disable selected models')}
                title={t('Disable selected models')}
              />
            }
          >
            <PowerOff />
            <span className='sr-only'>{t('Disable selected models')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Disable selected models')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={handleCopyNames}
                className='size-8'
                aria-label={t('Copy model names')}
                title={t('Copy model names')}
              />
            }
          >
            <Copy />
            <span className='sr-only'>{t('Copy model names')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Copy model names')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setShowDeleteConfirm(true)}
                className='size-8'
                aria-label={t('Delete selected models')}
                title={t('Delete selected models')}
              />
            }
          >
            <Trash2 />
            <span className='sr-only'>{t('Delete selected models')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Delete selected models')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('Delete Models?')}
        description={t(
          'Are you sure you want to delete {{count}} model(s)? This action cannot be undone.',
          { count: selectedIds.length }
        )}
        contentHeight='auto'
        footer={
          <>
            <Button
              variant='outline'
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t('Cancel')}
            </Button>
            <Button variant='destructive' onClick={handleDeleteAll}>
              {t('Delete')}
            </Button>
          </>
        }
      >
        {' '}
      </Dialog>

      <Dialog
        open={showBatchEdit}
        onOpenChange={setShowBatchEdit}
        title={t('Batch edit selected models')}
        description={t('Apply provider or tag changes to {{count}} model(s).', {
          count: selectedIds.length,
        })}
        contentHeight='auto'
        footer={
          <>
            <Button variant='outline' onClick={() => setShowBatchEdit(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleApplyBatchEdit}>
              {t('Apply to selected models')}
            </Button>
          </>
        }
      >
        <div className='space-y-5'>
          <div className='space-y-2'>
            <Label>{t('Provider')}</Label>
            <Select<string>
              value={selectedVendorId}
              onValueChange={(value) =>
                setSelectedVendorId(value || BULK_VENDOR_UNCHANGED)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Do not change provider')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={BULK_VENDOR_UNCHANGED}>
                    {t('Do not change provider')}
                  </SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-3'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Checkbox
                checked={replaceTags}
                onCheckedChange={(checked) => setReplaceTags(Boolean(checked))}
              />
              {t('Replace tags for selected models')}
            </label>
            <TagInput
              value={batchTags}
              onChange={setBatchTags}
              disabled={!replaceTags}
              placeholder={t('Add tags...')}
            />
            <p className='text-muted-foreground text-xs'>
              {t(
                'When enabled, the selected models will use exactly these tags. Leave empty to clear tags.'
              )}
            </p>
          </div>
        </div>
      </Dialog>
    </>
  )
}
