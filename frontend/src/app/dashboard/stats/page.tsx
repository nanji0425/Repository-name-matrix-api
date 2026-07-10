'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, ChevronDown, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';

const palette = ['#44c67a', '#22c5f7', '#fb923c', '#6366f1'];

export default function StatsPage() {
  const [stats, setStats] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    requestLogsApi.getStats().then((response) => setStats(response.data || {})).catch(() => setStats({}));
    requestLogsApi.list({ limit: 120 }).then((response) => {
      const data = response.data || {};
      setLogs(Array.isArray(data.items || data.logs || data.data) ? (data.items || data.logs || data.data) : []);
    }).catch(() => setLogs([]));
  }, []);

  const totalTokens = Number(stats?.totalPromptTokens || 0) + Number(stats?.totalCompletionTokens || 0);

  const chartData = useMemo(
    () =>
      [...logs]
        .reverse()
        .slice(0, 18)
        .map((log) => ({
          name: log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' }) : '',
          cost: Number(log.cost || 0),
          prompt: Number(log.promptTokens || 0),
          completion: Number(log.completionTokens || 0),
        })),
    [logs],
  );

  const ranking = useMemo(() => {
    const map = new Map<string, { name: string; requests: number; tokens: number; cost: number }>();
    for (const log of logs) {
      const name = log.model?.name || log.model?.modelCode || 'unknown';
      const row = map.get(name) || { name, requests: 0, tokens: 0, cost: 0 };
      row.requests += 1;
      row.tokens += Number(log.promptTokens || 0) + Number(log.completionTokens || 0);
      row.cost += Number(log.cost || 0);
      map.set(name, row);
    }
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost).slice(0, 6);
  }, [logs]);

  const statCards = [
    { label: '总数', value: Number(stats.totalRequests || 0).toLocaleString(), suffix: '统计计数' },
    { label: '总额度', value: `$${Number(stats.totalCost || 0).toFixed(2)}`, suffix: '统计配额' },
    { label: '总 TOKEN 数', value: `${(totalTokens / 10000).toFixed(1)}亿`, suffix: '统计 Token 数' },
    { label: '平均 RPM', value: logs.length ? (Number(stats.totalRequests || logs.length) / Math.max(1, logs.length / 60)).toFixed(2) : '0', suffix: '每分钟请求数' },
    { label: '平均 TPM', value: `${Math.round(totalTokens / Math.max(1, logs.length || 1) / 10)}万`, suffix: '每分钟 Token 数' },
  ];

  return (
    <ConsolePage className="pb-6">
      <section className="console-card p-0">
        <div className="flex items-center justify-between border-b border-[#f3d9e5] px-6 py-5">
          <div>
            <div className="text-2xl font-bold text-[#231f27]">模型调用分析</div>
            <div className="mt-1 text-sm text-[#9b8292]">查看模型、请求和费用分布</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="console-button-white inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> 偏好设置</button>
            <button className="console-button-white inline-flex items-center gap-2"><ChevronDown className="h-4 w-4" /> 筛选</button>
          </div>
        </div>

        <div className="grid gap-3 p-6 xl:grid-cols-5">
          {statCards.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[#f1d6e2] bg-white/85 p-5">
              <div className="text-xs text-[#ad8fa0]">{item.label}</div>
              <div className="mt-3 text-2xl font-bold text-[#231f27]">{item.value}</div>
              <div className="mt-1 text-xs text-[#c39aac]">{item.suffix}</div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-[28px] border border-[#f1d6e2] bg-white/85 p-5">
            <div className="mb-4 flex items-center gap-2 text-[#d36b9a]">
              <BarChart3 className="h-4 w-4" />
              <div className="font-bold">消耗分布</div>
              <span className="text-sm text-[#9b8292]">总计：${Number(stats.totalCost || 0).toFixed(2)}</span>
            </div>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(243,217,229,0.7)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#b18c9e', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#b18c9e', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 18, border: '1px solid #f1d6e2', background: 'rgba(255,255,255,0.97)' }} />
                  <Legend />
                  <Bar dataKey="prompt" stackId="a" fill="#22c5f7" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="completion" stackId="a" fill="#44c67a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="cost" stackId="b" fill="#fb923c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="console-card p-0">
        <div className="flex items-center justify-between border-b border-[#f3d9e5] px-6 py-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d36b9a]" />
            <div className="font-bold text-[#231f27]">调用趋势</div>
            <span className="text-sm text-[#9b8292]">总计：{Number(stats.totalRequests || 0).toLocaleString()}</span>
          </div>
          <div className="flex gap-2 text-sm text-[#8f7384]">
            <button className="rounded-full border border-[#f1d6e2] bg-white px-4 py-2">调用趋势</button>
            <button className="rounded-full border border-[#f1d6e2] bg-white px-4 py-2">调用次数分布</button>
            <button className="rounded-full border border-[#f1d6e2] bg-white px-4 py-2">调用次数排行</button>
          </div>
        </div>
        <div className="h-[380px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#44c67a" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#44c67a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c5f7" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#22c5f7" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(243,217,229,0.65)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#b18c9e', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#b18c9e', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 18, border: '1px solid #f1d6e2', background: 'rgba(255,255,255,0.97)' }} />
              <Legend />
              <Area type="monotone" dataKey="prompt" stroke="#44c67a" fill="url(#greenFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="completion" stroke="#22c5f7" fill="url(#blueFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="console-card p-0">
        <div className="border-b border-[#f3d9e5] px-6 py-5">
          <div className="font-bold text-[#231f27]">模型排行</div>
          <div className="text-sm text-[#9b8292]">按费用排序</div>
        </div>
        {ranking.length === 0 ? (
          <div className="px-6 py-14 text-center text-[#9b8292]">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-left text-sm">
              <thead className="bg-[#fff8fb] text-[#9b8292]">
                <tr>
                  <th className="px-6 py-4 font-medium">模型</th>
                  <th className="px-6 py-4 font-medium">请求数</th>
                  <th className="px-6 py-4 font-medium">Token</th>
                  <th className="px-6 py-4 font-medium">费用</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => (
                  <tr key={item.name} className="border-t border-[#f6e4ec]">
                    <td className="px-6 py-4 font-medium text-[#231f27]">{item.name}</td>
                    <td className="px-6 py-4 text-[#6b5363]">{item.requests}</td>
                    <td className="px-6 py-4 text-[#6b5363]">{item.tokens.toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-[#231f27]">${item.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ConsolePage>
  );
}
