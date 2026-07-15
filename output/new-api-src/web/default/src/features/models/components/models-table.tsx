/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { getUpstreamChannels } from '@/features/system-settings/api'
import { useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'

import { getModels, getVendors } from '../api'
import {
  DEFAULT_PAGE_SIZE,
  getModelStatusOptions,
  getSyncStatusOptions,
} from '../constants'
import { modelsQueryKeys, vendorsQueryKeys } from '../lib'
import {
  buildSelectedUpstreamModelRows,
  parseSelectedUpstreamChannelIds,
} from '../lib/selected-upstream-models'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { useModelsColumns } from './models-columns'
import { useModels } from './models-provider'

const route = getRouteApi('/_authenticated/models/$section')

export function ModelsTable() {
  const { t } = useTranslation()
  const { selectedVendor } = useModels()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: {
      defaultPage: 1,
      defaultPageSize: isMobile ? 10 : DEFAULT_PAGE_SIZE,
    },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'vendor_id', searchKey: 'vendor', type: 'array' },
      { columnId: 'sync_official', searchKey: 'sync', type: 'array' },
    ],
  })

  const statusFilter =
    (columnFilters.find((f) => f.id === 'status')?.value as string[]) || []
  const vendorFilter =
    (columnFilters.find((f) => f.id === 'vendor_id')?.value as string[]) || []
  const syncFilter =
    (columnFilters.find((f) => f.id === 'sync_official')?.value as string[]) ||
    []
  const statusFilterValue = statusFilter.find((value) => value !== 'all') || ''
  const vendorFilterValue = vendorFilter.find((value) => value !== 'all') || ''
  const syncFilterValue = syncFilter.find((value) => value !== 'all') || ''

  const { data: vendorsData } = useQuery({
    queryKey: vendorsQueryKeys.list(),
    queryFn: () => getVendors({ page_size: 1000 }),
  })
  const vendors = useMemo(
    () => vendorsData?.data?.items || [],
    [vendorsData?.data?.items]
  )
  const vendorOptions = useMemo(
    () => vendors.map((vendor) => ({ label: vendor.name, value: String(vendor.id) })),
    [vendors]
  )

  const { data: optionsData, isLoading: isOptionsLoading } = useSystemOptions()
  const { data: channelsData, isLoading: isChannelsLoading } = useQuery({
    queryKey: ['upstream-channels'],
    queryFn: getUpstreamChannels,
  })
  const { data: metadataData, isLoading: isModelsLoading } = useQuery({
    queryKey: modelsQueryKeys.list({ p: 1, page_size: 1000 }),
    queryFn: () => getModels({ p: 1, page_size: 1000 }),
  })

  const selectedChannelIds = useMemo(() => {
    const raw = optionsData?.data?.find(
      (option) => option.key === 'model_sync.selected_channels'
    )?.value
    return parseSelectedUpstreamChannelIds(raw)
  }, [optionsData?.data])

  const sourceRows = useMemo(
    () =>
      buildSelectedUpstreamModelRows(
        channelsData?.data || [],
        metadataData?.data?.items || [],
        selectedChannelIds
      ),
    [channelsData?.data, metadataData?.data?.items, selectedChannelIds]
  )

  const filteredModels = useMemo(() => {
    const keyword = (globalFilter || '').trim().toLowerCase()
    const activeVendor = selectedVendor || vendorFilterValue || undefined
    const activeStatus = statusFilterValue || undefined
    const activeSync = syncFilterValue || undefined

    return sourceRows.filter((model) => {
      if (
        keyword &&
        !`${model.model_name} ${model.source_channel_name}`
          .toLowerCase()
          .includes(keyword)
      ) {
        return false
      }
      if (activeVendor && String(model.vendor_id || '') !== activeVendor) {
        return false
      }
      if (activeStatus === 'enabled' && model.status !== 1) return false
      if (activeStatus === 'disabled' && model.status === 1) return false
      if (activeSync === 'yes' && model.sync_official !== 1) return false
      if (activeSync === 'no' && model.sync_official === 1) return false
      return true
    })
  }, [
    globalFilter,
    selectedVendor,
    sourceRows,
    statusFilterValue,
    syncFilterValue,
    vendorFilterValue,
  ])

  const models = useMemo(
    () =>
      filteredModels.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize
      ),
    [filteredModels, pagination.pageIndex, pagination.pageSize]
  )
  const vendorCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filteredModels.length }
    filteredModels.forEach((model) => {
      const key = String(model.vendor_id || '')
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [filteredModels])

  const columns = useModelsColumns(vendors)
  const { table } = useDataTable({
    data: models,
    columns,
    totalCount: filteredModels.length,
    initialColumnVisibility: {
      description: false,
      bound_channels: false,
      quota_types: false,
    },
    columnFilters,
    pagination,
    globalFilter,
    enableRowSelection: true,
    onColumnFiltersChange,
    onPaginationChange,
    onGlobalFilterChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    ensurePageInRange,
  })

  const vendorFilterOptions = [
    {
      label: `${t('All Vendors')}${vendorCounts.all ? ` (${vendorCounts.all})` : ''}`,
      value: 'all',
    },
    ...vendorOptions.map((option) => ({
      label: `${option.label}${vendorCounts[option.value] ? ` (${vendorCounts[option.value]})` : ''}`,
      value: option.value,
    })),
  ]

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isOptionsLoading || isChannelsLoading || isModelsLoading}
      isFetching={isOptionsLoading || isChannelsLoading || isModelsLoading}
      emptyTitle={t('No Models Found')}
      emptyDescription={t(
        'Select upstream channels in model sync to manage their models here.'
      )}
      skeletonKeyPrefix='model-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t('Filter by model name or upstream...'),
        filters: [
          {
            columnId: 'status',
            title: t('Status'),
            options: [...getModelStatusOptions(t)],
            singleSelect: true,
          },
          {
            columnId: 'vendor_id',
            title: t('Vendor'),
            options: vendorFilterOptions,
            singleSelect: true,
          },
          {
            columnId: 'sync_official',
            title: t('Official Sync'),
            options: [...getSyncStatusOptions(t)],
            singleSelect: true,
          },
        ],
      }}
      bulkActions={<DataTableBulkActions table={table} vendors={vendors} />}
    />
  )
}
