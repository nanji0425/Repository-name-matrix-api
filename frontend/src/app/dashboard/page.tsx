'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { requestLogsApi, walletApi } from '@/lib/api';
import {
  Wallet, Zap, BarChart3, Activity, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts';

// ── Types ──
interface DashboardStats {
  totalRequests?: number;
  successRate?: number;
  todayCost?: number;
  totalCost?: number;
  avgLatency?: number;
  avgRpm?: number;
  avgTpm?: number;
}

// ── Helpers ──
function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

type TimeRange = 'today' | 'yesterday' | '7days' | '1month';
type AnalysisTab = 'consumption' | 'trends' | 'distribution' | 'ranking';

const timeRangeOptions: { key: TimeRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7days', label: '7 Days' },
  { key: '1month', label: '1 Month' },
];

const analysisTabs: { key: AnalysisTab; label: string }[] = [
  { key: 'consumption', label: 'Consumption Distribution' },
  { key: 'trends', label: 'Call Trends' },
  { key: 'distribution', label: 'Call Count Distribution' },
  { key: 'ranking', label: 'Call Count Ranking' },
];

// ── Chart Colors ──
const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
const TREND_COLOR = '#1677ff';
const BAR_COLOR = '#1677ff';

// ── Sample / fallback chart data (used when API returns no results) ──
const fallbackConsumptionData = [
  { name: 'GPT-4o', value: 42 },
  { name: 'GPT-4o-mini', value: 28 },
  { name: 'Claude-3.5', value: 18 },
  { name: 'Claude-3-Haiku', value: 8 },
  { name: 'Other', value: 4 },
];

const fallbackTrendsData = [
  { date: '05/30', calls: 1200 },
  { date: '05/31', calls: 980 },
  { date: '06/01', calls: 1600 },
  { date: '06/02', calls: 2100 },
  { date: '06/03', calls: 1850 },
  { date: '06/04', calls: 2400 },
  { date: '06/05', calls: 3200 },
];

const fallbackDistributionData = [
  { hour: '00', count: 120 },
  { hour: '02', count: 80 },
  { hour: '04', count: 60 },
  { hour: '06', count: 150 },
  { hour: '08', count: 420 },
  { hour: '10', count: 890 },
  { hour: '12', count: 760 },
  { hour: '14', count: 1100 },
  { hour: '16', count: 950 },
  { hour: '18', count: 780 },
  { hour: '20', count: 540 },
  { hour: '22', count: 320 },
];

const fallbackRankingData = [
  { name: 'GPT-4o', count: 12500 },
  { name: 'GPT-4o-mini', count: 8700 },
  { name: 'Claude-3.5-Sonnet', count: 5400 },
  { name: 'Claude-3-Haiku', count: 3200 },
  { name: 'Gemini-1.5-Pro', count: 2100 },
  { name: 'DeepSeek-V3', count: 1500 },
];

// ── Component ──
export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({});
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('consumption');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      requestLogsApi.getStats().then((r) => setStats(r.data)).catch(() => {}),
      walletApi.getLogs({ limit: 100 }).then((r) => setWalletLogs(r.data?.logs || r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [timeRange]); // re-fetch when time range changes

  const timeOfDay = getTimeOfDay();
  const greeting = `Good ${timeOfDay}`;

  // ── Derived stats ──
  const currentBalance = user?.balance ?? 0;

  // Calculate total recharge from wallet logs
  const totalRecharge = walletLogs
    .filter((l: any) => l.type === 'RECHARGE' || l.amount > 0)
    .reduce((sum: number, l: any) => sum + Math.abs(l.amount || 0), 0);

  const totalConsumption = stats.totalCost ?? stats.todayCost ?? 0;
  const requestCount = stats.totalRequests ?? 0;
  const avgRpm = stats.avgRpm ?? 0;
  const avgTpm = stats.avgTpm ?? 0;

  // ── Build chart data from real wallet logs ──
  const consumptionData = (() => {
    const groups: Record<string, number> = {};
    walletLogs.forEach((l: any) => {
      const key = l.remark?.split('(')[0]?.trim() || 'Other';
      groups[key] = (groups[key] || 0) + Math.abs(l.amount || 0);
    });
    const entries = Object.entries(groups);
    if (entries.length === 0) return fallbackConsumptionData;
    return entries.slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  })();

  const trendsData = (() => {
    const groups: Record<string, number> = {};
    walletLogs.forEach((l: any) => {
      const date = l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : '';
      if (date) groups[date] = (groups[date] || 0) + 1;
    });
    const entries = Object.entries(groups);
    if (entries.length === 0) return fallbackTrendsData;
    return entries.slice(-14).map(([date, calls]) => ({ date, calls }));
  })();

  const rankingData = (() => {
    const groups: Record<string, number> = {};
    walletLogs.forEach((l: any) => {
      const name = l.remark?.split(' ')[2] || 'Other';
      groups[name] = (groups[name] || 0) + 1;
    });
    const entries = Object.entries(groups);
    if (entries.length === 0) return fallbackRankingData;
    return entries.slice(0, 6).map(([name, count]) => ({ name, count }));
  })();

  const statCards = [
    {
      label: 'Current Balance',
      value: `$${currentBalance.toFixed(2)}`,
      icon: Wallet,
      color: '#1677ff',
      bg: '#e6f4ff',
      footer: `${totalRecharge > 0 ? '+' : ''}$${totalRecharge.toFixed(2)} total recharged`,
    },
    {
      label: 'Recharge',
      value: `$${totalRecharge.toFixed(2)}`,
      icon: TrendingUp,
      color: '#52c41a',
      bg: '#f6ffed',
      footer: 'Lifetime total',
    },
    {
      label: 'Total Consumption',
      value: `$${typeof totalConsumption === 'number' ? totalConsumption.toFixed(4) : '0.0000'}`,
      icon: Zap,
      color: '#faad14',
      bg: '#fffbe6',
      footer: 'All-time usage cost',
    },
    {
      label: 'Request Count',
      value: formatCompact(requestCount),
      icon: Activity,
      color: '#722ed1',
      bg: '#f9f0ff',
      footer: `${requestCount.toLocaleString()} total requests`,
    },
    {
      label: 'Avg RPM',
      value: typeof avgRpm === 'number' ? avgRpm.toFixed(1) : '0.0',
      icon: BarChart3,
      color: '#13c2c2',
      bg: '#e6fffb',
      footer: 'Requests per minute',
    },
    {
      label: 'Avg TPM',
      value: typeof avgTpm === 'number' ? avgTpm.toLocaleString() : '0',
      icon: TrendingDown,
      color: '#eb2f96',
      bg: '#fff0f6',
      footer: 'Tokens per minute',
    },
  ];

  // ── Render chart by active tab ──
  const renderChart = () => {
    switch (activeTab) {
      case 'consumption':
        return (
          <div className="flex items-center justify-center" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={consumptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {consumptionData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'trends':
        return (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TREND_COLOR} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={TREND_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke={TREND_COLOR}
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'distribution':
        return (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fallbackDistributionData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'ranking':
        return (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankingData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-primary)' }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  formatter={(value: number) => [value.toLocaleString(), 'Calls']}
                />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* ── Welcome Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {greeting}, {user?.username} <span className="wave">&#x1f44b;</span>
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Welcome back to your dashboard
            </div>
          </div>
          <span
            className="ant-tag ant-tag-green"
            style={{ alignSelf: 'flex-start', marginTop: 4 }}
          >
            Running / User
          </span>
        </div>
      </div>

      {/* ── Time Range Tabs ── */}
      <div className="ant-tabs mb-6">
        {timeRangeOptions.map((opt) => (
          <button
            key={opt.key}
            className={timeRange === opt.key ? 'ant-tabs-tab ant-tabs-tab-active' : 'ant-tabs-tab'}
            onClick={() => setTimeRange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="stat-label">{card.label}</div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: card.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-footer">{card.footer}</div>
            </div>
          );
        })}
      </div>

      {/* ── Model Data Analysis ── */}
      <div className="ant-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Model Data Analysis
          </h3>
        </div>

        {/* Analysis Tabs */}
        <div className="ant-tabs">
          {analysisTabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'ant-tabs-tab ant-tabs-tab-active' : 'ant-tabs-tab'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        {renderChart()}
      </div>

      {/* ── Inline style for wave animation ── */}
      <style jsx>{`
        .wave {
          display: inline-block;
          animation: wave-anim 2s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
        @keyframes wave-anim {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60%, 100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
