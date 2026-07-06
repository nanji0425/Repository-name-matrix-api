'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestLogsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Activity, DollarSign, Gauge, Hash } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '用量统计',
    totalRequests: '请求总量',
    totalTokens: '总 Token',
    totalCost: '总费用',
    avgLatency: '平均延迟',
    trend: '延迟与费用趋势',
    latency: '延迟 (ms)',
    cost: '费用',
    modelRanking: '模型排行',
    empty: '暂无用量数据。',
    model: '模型',
    requests: '请求数',
    tokenUsage: 'Token 用量',
  },
  en: {
    title: 'Usage Statistics',
    totalRequests: 'Total Requests',
    totalTokens: 'Total Tokens',
    totalCost: 'Total Cost',
    avgLatency: 'Avg Latency',
    trend: 'Latency and Cost Trend',
    latency: 'Latency (ms)',
    cost: 'Cost',
    modelRanking: 'Model Ranking',
    empty: 'No usage data yet.',
    model: 'Model',
    requests: 'Requests',
    tokenUsage: 'Token Usage',
  },
} as const;

export default function StatsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [stats, setStats] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    requestLogsApi.getStats().then((response) => setStats(response.data || {})).catch(() => {});
    requestLogsApi.list({ limit: 50 }).then((response) => {
      const data = response.data || {};
      setLogs(data.items || data.logs || data.data || []);
    }).catch(() => {});
  }, []);

  const totalTokens = (stats?.totalPromptTokens || 0) + (stats?.totalCompletionTokens || 0);

  const chartData = useMemo(
    () =>
      [...logs]
        .reverse()
        .slice(0, 20)
        .map((log: any) => ({
          time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          latency: log.latency || 0,
          cost: log.cost || 0,
        })),
    [locale, logs],
  );

  const ranking = useMemo(() => {
    const modelRanking: Record<string, { requests: number; tokens: number; cost: number }> = {};

    logs.forEach((log: any) => {
      const name = log.model?.modelCode || log.modelCode || 'unknown';
      if (!modelRanking[name]) modelRanking[name] = { requests: 0, tokens: 0, cost: 0 };
      modelRanking[name].requests += 1;
      modelRanking[name].tokens += (log.promptTokens || 0) + (log.completionTokens || 0);
      modelRanking[name].cost += log.cost || 0;
    });

    return Object.entries(modelRanking)
      .map(([model, data]) => ({ model, ...data }))
      .sort((left, right) => right.cost - left.cost);
  }, [logs]);

  const statCards = [
    { label: text.totalRequests, value: stats?.totalRequests ?? '-', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: text.totalTokens, value: totalTokens || '-', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: text.totalCost, value: stats?.totalCost != null ? formatCurrency(stats.totalCost) : '-', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: text.avgLatency, value: logs.length ? `${Math.round(logs.reduce((sum, log) => sum + Number(log.latency || 0), 0) / logs.length)}ms` : '-', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-2 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-950 dark:text-white">{card.value}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card mb-8 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">{text.trend}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#6366f1" name={text.latency} strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" name={text.cost} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card dark:border-white/10 dark:bg-white/[0.04]">
        <div className="card-header dark:border-white/10">
          <h3 className="font-semibold text-slate-950 dark:text-white">{text.modelRanking}</h3>
        </div>
        <div className="card-body p-0">
          {ranking.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">{text.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-white/10">
                    <th className="px-6 py-3 font-medium">{text.model}</th>
                    <th className="px-6 py-3 font-medium">{text.requests}</th>
                    <th className="px-6 py-3 font-medium">{text.tokenUsage}</th>
                    <th className="px-6 py-3 font-medium">{text.cost}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/10">
                  {ranking.map((item) => (
                    <tr key={item.model} className="hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-6 py-3 font-medium text-slate-950 dark:text-white">{item.model}</td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{item.requests}</td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{item.tokens.toLocaleString()}</td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
