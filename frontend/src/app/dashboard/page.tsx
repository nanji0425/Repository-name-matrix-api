'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { cn } from '@/lib/utils';

type Stats = {
  totalRequests?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalCost?: number;
};

const text = {
  zh: {
    title: '控制台',
    desc: '模型数据分析和统计',
    create: '去创建 API Key',
    ranges: ['今天', '最近7天', '最近30天'],
    tabs: ['消费分布', '消费趋势', '调用分布', '调用排名'],
    balance: '当前余额',
    cost: '历史消费',
    requests: '请求次数',
    tokens: '总 Token 数',
    modelCost: '模型调用',
    today: '今日',
    week: '最近7天',
    month: '最近30天',
    active: '活跃',
    summary: '汇总',
    status: '请求状态',
    apiStatus: '接口状态',
    range: '统计范围',
    normal: '正常',
    compatible: 'OpenAI 兼容',
  },
  en: {
    title: 'Console',
    desc: 'Model usage analytics and statistics',
    create: 'Create API Key',
    ranges: ['Today', 'Last 7 days', 'Last 30 days'],
    tabs: ['Cost Distribution', 'Cost Trend', 'Call Distribution', 'Call Ranking'],
    balance: 'Current Balance',
    cost: 'Total Cost',
    requests: 'Requests',
    tokens: 'Total Tokens',
    modelCost: 'Model Calls',
    today: 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    active: 'Active',
    summary: 'Summary',
    status: 'Request Status',
    apiStatus: 'API Status',
    range: 'Range',
    normal: 'Normal',
    compatible: 'OpenAI Compatible',
  },
} as const;

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const locale = useLocaleStore((state) => state.locale);
  const copy = text[locale];
  const [stats, setStats] = useState<Stats>({});
  const [range, setRange] = useState<string>(copy.ranges[1]);
  const [tab, setTab] = useState<string>(copy.tabs[2]);

  useEffect(() => {
    setRange(text[locale].ranges[1]);
    setTab(text[locale].tabs[2]);
  }, [locale]);

  useEffect(() => {
    requestLogsApi.getStats().then((response) => setStats(response.data || {})).catch(() => setStats({}));
  }, []);

  const totalTokens = Number(stats.totalPromptTokens || 0) + Number(stats.totalCompletionTokens || 0);
  const cards = useMemo(
    () => [
      { value: `¥${Number(user?.balance || 0).toFixed(2)}`, label: copy.balance },
      { value: `¥${Number(stats.totalCost || 0).toFixed(2)}`, label: copy.cost },
      { value: String(stats.totalRequests || 0), label: copy.requests },
      { value: String(totalTokens), label: copy.tokens },
    ],
    [copy, stats, totalTokens, user?.balance],
  );

  const breakdown = useMemo(() => {
    const cost = Number(stats.totalCost || 0);
    const promptTokens = Number(stats.totalPromptTokens || 0);
    const completionTokens = Number(stats.totalCompletionTokens || 0);
    if (tab === copy.tabs[0]) {
      return [
        { label: copy.modelCost, value: `¥${cost.toFixed(2)}` },
        { label: 'Prompt Tokens', value: String(promptTokens) },
        { label: 'Completion Tokens', value: String(completionTokens) },
      ];
    }
    if (tab === copy.tabs[2]) {
      return [
        { label: copy.today, value: range === copy.ranges[0] ? copy.active : copy.summary },
        { label: copy.week, value: range === copy.ranges[1] ? copy.active : copy.summary },
        { label: copy.month, value: range === copy.ranges[2] ? copy.active : copy.summary },
      ];
    }
    return [
      { label: copy.status, value: copy.normal },
      { label: copy.apiStatus, value: copy.compatible },
      { label: copy.range, value: range },
    ];
  }, [copy, range, stats, tab]);

  return (
    <ConsolePage className="pb-28">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{copy.desc}</p>
        </div>
        <div className="flex justify-center">
          <Link href="/dashboard/api-keys" className="console-button-white inline-flex min-w-[170px] items-center justify-center text-center">
            {copy.create}
          </Link>
        </div>
        <div className="flex justify-start lg:justify-end">
          <div className="inline-flex rounded-lg border border-slate-300/50 bg-white/70 p-1 dark:border-white/15 dark:bg-[#0f1117]">
            {copy.ranges.map((item) => (
              <button key={item} onClick={() => setRange(item)} className={cn('h-8 rounded-md px-4 text-sm transition', range === item ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white')}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="console-card h-[116px] p-7">
            <div className="text-3xl font-black text-slate-950 dark:text-white">{card.value}</div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{card.label}</div>
          </div>
        ))}
      </div>

      <section className="console-card mt-6 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {copy.tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={cn('h-9 rounded-lg px-4 text-sm font-bold transition', tab === item ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white')}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {breakdown.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-300/40 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </ConsolePage>
  );
}
