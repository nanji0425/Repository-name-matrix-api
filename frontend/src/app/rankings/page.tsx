'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { Badge } from '@/components/ui/Badge';

type TimeRange = 'today' | 'week' | 'month' | 'year';

const mockHotModels = [
  { rank: 1, name: 'gpt-4-turbo', provider: 'OpenAI', tokens: 6_617_000, trend: '+12.4%', up: true },
  { rank: 2, name: 'claude-3.5-sonnet', provider: 'Anthropic', tokens: 5_708_000, trend: '+8.2%', up: true },
  { rank: 3, name: 'gpt-3.5-turbo', provider: 'OpenAI', tokens: 4_130_000, trend: '-3.1%', up: false },
  { rank: 4, name: 'gemini-pro-1.5', provider: 'Google', tokens: 3_976_000, trend: '+5.6%', up: true },
  { rank: 5, name: 'deepseek-chat', provider: 'DeepSeek', tokens: 2_730_000, trend: '+24.3%', up: true },
  { rank: 6, name: 'claude-opus-4', provider: 'Anthropic', tokens: 1_290_000, trend: '-1.4%', up: false },
  { rank: 7, name: 'qwen-2.5-turbo', provider: 'Alibaba', tokens: 990_000, trend: '+18.7%', up: true },
  { rank: 8, name: 'llama-3.1-70b', provider: 'Meta', tokens: 773_000, trend: '+6.2%', up: true },
];

const mockProviders = [
  { rank: 1, name: 'OpenAI', tokens: 7_907_000, percentage: 37.2 },
  { rank: 2, name: 'Anthropic', tokens: 6_998_000, percentage: 32.9 },
  { rank: 3, name: 'Google', tokens: 3_976_000, percentage: 18.7 },
  { rank: 4, name: 'DeepSeek', tokens: 2_730_000, percentage: 12.8 },
  { rank: 5, name: 'Alibaba', tokens: 990_000, percentage: 4.7 },
];

export default function RankingsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '今年' },
  ];

  return (
    <ConsolePage>
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-3">排行榜</h1>
        <p className="text-gray-600">探索平台上最热门的模型和供应商，基于实时 Token 用量统计</p>
      </div>

      {/* 时间范围选择 */}
      <div className="mb-8 flex gap-2">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              timeRange === range.value
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-soft'
                : 'bg-white border border-purple-200 text-gray-700 hover:border-purple-300'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 热门模型排行 */}
        <div className="console-card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🔥 热门模型排行</h2>
            <p className="text-sm text-gray-600">根据消耗的 Token 用量排序</p>
          </div>

          {/* 柱状图区域 */}
          <div className="mb-6 h-48 flex items-end justify-between gap-2 px-4">
            {mockHotModels.slice(0, 7).map((model, index) => {
              const maxTokens = mockHotModels[0].tokens;
              const height = (model.tokens / maxTokens) * 100;

              return (
                <div key={model.name} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-bold text-gray-700">{(model.tokens / 1000000).toFixed(1)}M</div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 transition-all hover:from-blue-600 hover:to-cyan-500 cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={model.name}
                  />
                  <div className="text-xs text-gray-500 text-center truncate w-full">{model.rank}</div>
                </div>
              );
            })}
          </div>

          {/* 排名列表 */}
          <div className="space-y-2">
            {mockHotModels.map((model) => (
              <div key={model.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                  model.rank <= 3
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {model.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{model.name}</div>
                  <div className="text-xs text-gray-500">by {model.provider}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900">{(model.tokens / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-500">Tokens</div>
                </div>

                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  model.up ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {model.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {model.trend}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 供应商排行 */}
        <div className="console-card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">📊 供应商排行</h2>
            <p className="text-sm text-gray-600">各供应商 Token 消耗统计</p>
          </div>

          {/* 柱状图区域 */}
          <div className="mb-6 h-48 flex items-end justify-between gap-2 px-4">
            {mockProviders.map((provider) => {
              const height = provider.percentage;

              return (
                <div key={provider.name} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-bold text-gray-700">{provider.percentage}%</div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all hover:from-emerald-600 hover:to-teal-500 cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={provider.name}
                  />
                  <div className="text-xs text-gray-500 text-center truncate w-full">{provider.rank}</div>
                </div>
              );
            })}
          </div>

          {/* 排名列表 */}
          <div className="space-y-2">
            {mockProviders.map((provider) => (
              <div key={provider.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                  provider.rank <= 3
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {provider.rank}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{provider.name}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900">{(provider.tokens / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-500">Tokens</div>
                </div>

                <Badge variant={provider.rank <= 2 ? 'green' : 'gray'} size="sm">
                  {provider.percentage}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 上升/下降趋势 */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="console-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">📈 上升趋势</h3>
          </div>
          <div className="space-y-2">
            {mockHotModels.filter(m => m.up).slice(0, 5).map((model, index) => (
              <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                <div>
                  <div className="font-semibold text-gray-900">{model.name}</div>
                  <div className="text-xs text-gray-500">{model.provider}</div>
                </div>
                <Badge variant="green" size="sm">{model.trend}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="console-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-bold text-gray-900">📉 下降趋势</h3>
          </div>
          <div className="space-y-2">
            {mockHotModels.filter(m => !m.up).map((model, index) => (
              <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-rose-50">
                <div>
                  <div className="font-semibold text-gray-900">{model.name}</div>
                  <div className="text-xs text-gray-500">{model.provider}</div>
                </div>
                <Badge variant="pink" size="sm">{model.trend}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
