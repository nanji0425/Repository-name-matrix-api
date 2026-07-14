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
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CreditCard,
  KeyRound,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import { getAdminDashboardMetrics } from './api'
import {
  formatCompactNumber,
  formatErrorType,
  formatHourLabel,
  formatTokens,
} from './lib/format'
import type {
  AdminDashboardErrorSummary,
  AdminDashboardHourlyRequest,
  AdminDashboardMetrics,
  AdminDashboardTopModel,
} from './types'

type MetricCardProps = {
  title: string
  value: string
  description: string
  icon: ReactNode
  tone?: 'default' | 'green' | 'orange' | 'red' | 'purple'
}

const toneClassName: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  orange: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-destructive/10 text-destructive',
  purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

function MetricCard(props: MetricCardProps) {
  const tone = props.tone ?? 'default'
  return (
    <Card className='min-h-34'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0'>
        <div className='space-y-1'>
          <CardDescription>{props.title}</CardDescription>
          <CardTitle className='text-2xl font-bold tracking-tight'>
            {props.value}
          </CardTitle>
        </div>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            toneClassName[tone]
          )}
          aria-hidden='true'
        >
          {props.icon}
        </span>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground text-xs'>{props.description}</p>
      </CardContent>
    </Card>
  )
}

function MetricSkeletonGrid() {
  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-28' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-3 w-36' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function HourlyTrendPanel(props: { data: AdminDashboardHourlyRequest[] }) {
  const { t } = useTranslation()
  const maxRequests = Math.max(...props.data.map((item) => item.requests), 1)
  const visible = props.data.filter((_, index) => index % 2 === 0)

  return (
    <Card className='lg:col-span-7'>
      <CardHeader>
        <CardTitle>{t('Last 24 Hours Requests')}</CardTitle>
        <CardDescription>
          {t('Hourly request volume and token usage for today.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex h-64 items-end gap-1.5 rounded-lg border p-3'>
          {props.data.map((item) => {
            const height = Math.max((item.requests / maxRequests) * 100, 3)
            return (
              <div
                key={item.hour}
                className='group flex min-w-0 flex-1 flex-col items-center justify-end gap-2'
              >
                <div className='text-muted-foreground hidden text-[10px] group-hover:block'>
                  {formatCompactNumber(item.requests)}
                </div>
                <div
                  className='bg-primary/75 hover:bg-primary w-full rounded-t transition-colors'
                  style={{ height: `${height}%` }}
                  title={`${formatHourLabel(item.hour)} · ${formatCompactNumber(item.requests)} ${t('requests')}`}
                />
              </div>
            )
          })}
        </div>
        <div className='text-muted-foreground mt-2 grid grid-cols-6 text-[10px]'>
          {visible.map((item) => (
            <span key={item.hour}>{formatHourLabel(item.hour)}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TopModelsPanel(props: { data: AdminDashboardTopModel[] }) {
  const { t } = useTranslation()
  return (
    <Card className='lg:col-span-5'>
      <CardHeader>
        <CardTitle>{t('Top Models')}</CardTitle>
        <CardDescription>
          {t('Models with the highest token usage today.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {props.data.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              {t('No model usage yet today.')}
            </p>
          )}
          {props.data.map((item, index) => (
            <div
              key={item.model}
              className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold'>
                    {index + 1}
                  </span>
                  <span className='truncate text-sm font-medium'>
                    {item.model}
                  </span>
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {formatCompactNumber(item.requests)} {t('requests')}
                </p>
              </div>
              <div className='text-right text-sm font-semibold'>
                {formatTokens(item.tokens)}
                <p className='text-muted-foreground text-xs font-normal'>
                  {t('tokens')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorSummaryPanel(props: { data: AdminDashboardErrorSummary[] }) {
  const { t } = useTranslation()
  return (
    <Card className='lg:col-span-7'>
      <CardHeader>
        <CardTitle>{t('Recent Exceptions')}</CardTitle>
        <CardDescription>
          {t('Exception categories recorded today.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-3 sm:grid-cols-2'>
          {props.data.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              {t('No exceptions recorded today.')}
            </p>
          )}
          {props.data.map((item) => (
            <div
              key={item.type}
              className='flex items-center justify-between rounded-lg border px-3 py-2.5'
            >
              <span className='text-sm'>{t(formatErrorType(item.type))}</span>
              <span className='font-semibold tabular-nums'>
                {formatCompactNumber(item.count)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UserActivityPanel(props: {
  data: AdminDashboardMetrics['user_activity']
}) {
  const { t } = useTranslation()
  const items = [
    {
      label: t('Created API Key Users'),
      value: props.data.created_api_key_users,
    },
    {
      label: t('Active Users Today'),
      value: props.data.active_users,
    },
    {
      label: t('Top-up Users Today'),
      value: props.data.topup_users,
    },
  ]

  return (
    <Card className='lg:col-span-5'>
      <CardHeader>
        <CardTitle>{t('User Activity')}</CardTitle>
        <CardDescription>
          {t('Key user actions that happened today.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {items.map((item) => (
            <div
              key={item.label}
              className='flex items-center justify-between rounded-lg border px-3 py-2.5'
            >
              <span className='text-muted-foreground text-sm'>
                {item.label}
              </span>
              <span className='font-semibold tabular-nums'>
                {formatCompactNumber(item.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminDashboardContent(props: { data: AdminDashboardMetrics }) {
  const { t } = useTranslation()
  const metrics = useMemo(
    () => [
      {
        title: t('Today New Users'),
        value: formatCompactNumber(props.data.today_new_users),
        description: t('New accounts registered today.'),
        icon: <Users className='size-4' />,
        tone: 'green' as const,
      },
      {
        title: t('Total Users'),
        value: formatCompactNumber(props.data.total_users),
        description: t('All registered accounts on the platform.'),
        icon: <Users className='size-4' />,
        tone: 'default' as const,
      },
      {
        title: t('Today Requests'),
        value: formatCompactNumber(props.data.today_requests),
        description: t('Successful and failed API requests today.'),
        icon: <Activity className='size-4' />,
        tone: 'purple' as const,
      },
      {
        title: t('Today Tokens'),
        value: formatTokens(props.data.today_tokens),
        description: t('Input and output tokens consumed today.'),
        icon: <TrendingUp className='size-4' />,
        tone: 'orange' as const,
      },
      {
        title: t('Total Tokens'),
        value: formatTokens(props.data.total_tokens),
        description: t('All-time token consumption.'),
        icon: <BarChart3 className='size-4' />,
        tone: 'default' as const,
      },
      {
        title: t('Today Spend'),
        value: formatQuota(props.data.today_quota),
        description: t('Today consumption shown with platform quota display.'),
        icon: <CreditCard className='size-4' />,
        tone: 'green' as const,
      },
      {
        title: t('Today Top-up'),
        value: formatCompactNumber(props.data.today_topup),
        description: t('Successful top-up order amount today.'),
        icon: <CreditCard className='size-4' />,
        tone: 'green' as const,
      },
      {
        title: t('Failed Requests'),
        value: formatCompactNumber(props.data.today_failed_requests),
        description: t('Errors recorded today that may need attention.'),
        icon: <AlertTriangle className='size-4' />,
        tone:
          props.data.today_failed_requests > 0
            ? ('red' as const)
            : ('green' as const),
      },
    ],
    [props.data, t]
  )

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-12'>
        <HourlyTrendPanel data={props.data.hourly_requests} />
        <TopModelsPanel data={props.data.top_models} />
      </div>
      <div className='grid gap-4 lg:grid-cols-12'>
        <ErrorSummaryPanel data={props.data.error_summary} />
        <UserActivityPanel data={props.data.user_activity} />
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: getAdminDashboardMetrics,
    refetchOnWindowFocus: false,
  })

  const data = query.data?.data

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Data Panel')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={cn('size-4', query.isFetching && 'animate-spin')}
            aria-hidden='true'
          />
          {t('Refresh Data')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='space-y-4'>
          <div className='from-primary/10 via-background to-background rounded-xl border bg-linear-to-br p-4'>
            <div className='flex items-start gap-3'>
              <span className='bg-primary/10 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl'>
                <KeyRound className='size-5' aria-hidden='true' />
              </span>
              <div>
                <h3 className='text-base font-semibold'>
                  {t('Admin Operations Overview')}
                </h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {t(
                    'Track users, requests, token usage, top-up activity, model usage, and exceptions from one place.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {query.isLoading && <MetricSkeletonGrid />}

          {query.isError && (
            <Alert variant='destructive'>
              <AlertTriangle className='size-4' aria-hidden='true' />
              <AlertTitle>{t('Failed to load data panel')}</AlertTitle>
              <AlertDescription>
                {t('Please retry. The page will not stay in a loading state.')}
              </AlertDescription>
            </Alert>
          )}

          {data && <AdminDashboardContent data={data} />}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
