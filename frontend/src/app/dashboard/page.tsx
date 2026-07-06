'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

type Stats = {
  totalRequests?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalCost?: number;
};

const timeRanges = ['今天', '最近7天', '最近30天'];
const analysisTabs = ['消费分布', '消费趋势', '调用分布', '调用排名'];

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({});
  const [range, setRange] = useState('最近7天');
  const [tab, setTab] = useState('调用分布');

  useEffect(() => {
    requestLogsApi.getStats().then((response) => setStats(response.data || {})).catch(() => setStats({}));
  }, []);

  const totalTokens = Number(stats.totalPromptTokens || 0) + Number(stats.totalCompletionTokens || 0);
  const cards = useMemo(
    () => [
      { value: `¥${Number(user?.balance || 0).toFixed(2)}`, label: '当前余额' },
      { value: `¥${Number(stats.totalCost || 0).toFixed(2)}`, label: '历史消费' },
      { value: String(stats.totalRequests || 0), label: '请求次数' },
      { value: String(totalTokens), label: '总 Token 数' },
    ],
    [stats, totalTokens, user?.balance],
  );

  const breakdown = useMemo(() => {
    const cost = Number(stats.totalCost || 0);
    const promptTokens = Number(stats.totalPromptTokens || 0);
    const completionTokens = Number(stats.totalCompletionTokens || 0);
    if (tab === '消费分布') {
      return [
        { label: '模型调用', value: `¥${cost.toFixed(2)}` },
        { label: 'Prompt Tokens', value: String(promptTokens) },
        { label: 'Completion Tokens', value: String(completionTokens) },
      ];
    }
    if (tab === '调用分布') {
      return [
        { label: '今日', value: range === '今天' ? '活跃' : '汇总' },
        { label: '最近7天', value: range === '最近7天' ? '活跃' : '汇总' },
        { label: '最近30天', value: range === '最近30天' ? '活跃' : '汇总' },
      ];
    }
    return [
      { label: '请求状态', value: '正常' },
      { label: '接口状态', value: 'OpenAI 兼容' },
      { label: '统计范围', value: range },
    ];
  }, [range, stats, tab]);

  return (
    <ConsolePage className="pb-28">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">控制台</h1>
          <p className="mt-2 text-sm text-slate-400">模型数据分析和统计</p>
        </div>
        <Link href="/dashboard/api-keys" className="console-button-white">
          去创建 API Key
        </Link>
        <div className="inline-flex rounded-lg border border-white/15 bg-[#0f1117] p-1">
          {timeRanges.map((item) => (
            <button key={item} onClick={() => setRange(item)} className={cn('h-8 rounded-md px-4 text-sm transition', range === item ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white')}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="console-card h-[116px] p-7">
            <div className="text-3xl font-black text-white">{card.value}</div>
            <div className="mt-3 text-sm text-slate-400">{card.label}</div>
          </div>
        ))}
      </div>

      <section className="console-card mt-6 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {analysisTabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={cn('h-9 rounded-lg px-4 text-sm font-bold transition', tab === item ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white')}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {breakdown.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </ConsolePage>
  );
}
