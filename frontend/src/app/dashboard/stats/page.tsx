'use client';

import { useEffect, useState } from 'react';
import { requestLogsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, DollarSign, Gauge, Hash } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    requestLogsApi.getStats().then((r) => setStats(r.data)).catch(() => {});
    requestLogsApi.list({ limit: 50 }).then((r) => setLogs(r.data?.logs || r.data || [])).catch(() => {});
  }, []);

  // Aggregate data for line chart (requests over time)
  const chartData = [...logs]
    .reverse()
    .slice(0, 20)
    .map((log: any) => ({
      time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
      latency: log.latency || 0,
      cost: log.cost || 0,
    }));

  // Model ranking
  const modelRanking: Record<string, { requests: number; tokens: number; cost: number }> = {};
  logs.forEach((log: any) => {
    const name = log.model?.modelCode || log.modelCode || 'unknown';
    if (!modelRanking[name]) modelRanking[name] = { requests: 0, tokens: 0, cost: 0 };
    modelRanking[name].requests += 1;
    modelRanking[name].tokens += (log.promptTokens || 0) + (log.completionTokens || 0);
    modelRanking[name].cost += log.cost || 0;
  });
  const ranking = Object.entries(modelRanking)
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const statCards = [
    { label: 'Total Requests', value: stats?.totalRequests ?? '—', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Tokens', value: stats?.totalTokens ?? '—', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Cost', value: stats?.totalCost != null ? formatCurrency(stats.totalCost) : '—', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg Latency', value: stats?.avgLatency != null ? `${stats.avgLatency}ms` : '—', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usage Statistics</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Line Chart */}
      <div className="card p-4 mb-8">
        <h3 className="font-semibold mb-4">Latency & Cost Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#6366f1" name="Latency (ms)" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" name="Cost ($)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Ranking Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Model Ranking</h3>
        </div>
        <div className="card-body p-0">
          {ranking.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">No usage data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Model</th>
                    <th className="px-6 py-3 font-medium">Requests</th>
                    <th className="px-6 py-3 font-medium">Token Usage</th>
                    <th className="px-6 py-3 font-medium">Cost</th>
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
