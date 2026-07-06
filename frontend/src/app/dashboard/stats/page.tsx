'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestLogsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Activity, DollarSign, Gauge, Hash } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function StatsPage() {
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
          time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
          latency: log.latency || 0,
          cost: log.cost || 0,
        })),
    [logs],
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
    { label: '请求总量', value: stats?.totalRequests ?? '-', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '总 Token', value: totalTokens || '-', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '总费用', value: stats?.totalCost != null ? formatCurrency(stats.totalCost) : '-', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '平均延迟', value: logs.length ? `${Math.round(logs.reduce((sum, log) => sum + Number(log.latency || 0), 0) / logs.length)}ms` : '-', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">用量统计</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="mt-1 text-xs text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card mb-8 p-4">
        <h3 className="mb-4 font-semibold">延迟与费用趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#6366f1" name="延迟 (ms)" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" name="费用" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">模型排行</h3>
        </div>
        <div className="card-body p-0">
          {ranking.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">暂无用量数据。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">模型</th>
                    <th className="px-6 py-3 font-medium">请求数</th>
                    <th className="px-6 py-3 font-medium">Token 用量</th>
                    <th className="px-6 py-3 font-medium">费用</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ranking.map((item) => (
                    <tr key={item.model} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{item.model}</td>
                      <td className="px-6 py-3">{item.requests}</td>
                      <td className="px-6 py-3">{item.tokens.toLocaleString()}</td>
                      <td className="px-6 py-3">{formatCurrency(item.cost)}</td>
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
