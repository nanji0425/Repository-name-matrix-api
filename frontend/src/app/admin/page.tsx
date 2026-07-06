'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  Activity,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Globe,
  Key,
  Layers3,
  LayoutDashboard,
  MessageSquareText,
  Rocket,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocaleStore } from '@/stores/localeStore';

type AdminStats = {
  users?: { total?: number; active?: number; disabled?: number; admins?: number };
  apiKeys?: { total?: number; active?: number; disabled?: number };
  models?: { total?: number; active?: number; disabled?: number };
  providers?: { total?: number; active?: number };
  orders?: { total?: number; completed?: number; pending?: number; failed?: number; revenue?: number };
  wallet?: { totalRecharge?: number };
  requests?: {
    total?: number;
    success?: number;
    failed?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
    avgLatency?: number;
  };
  commissions?: { total?: number; amount?: number };
  teams?: { total?: number; members?: number };
  announcements?: number;
  legacy?: { users?: number; orders?: number; revenue?: number; models?: number; totalRequests?: number };
};

const copy = {
  zh: {
    heroBadge: 'MatrixAPI 管理控制台',
    title: '管理员总览',
    desc: '这里集中展示平台的用户、模型、订单、资金、请求与团队数据，方便你快速判断平台是否健康。',
    modelButton: '前往模型管理',
    realtime: '实时汇总平台核心运营数据。',
    summary: ['用户总数', 'API Key 总数', '模型总数', '订单总数', '请求总量', '累计收入'],
    sections: {
      users: '用户与权限',
      resources: '资源与渠道',
      finance: '资金与订单',
      traffic: '流量与性能',
      team: '团队与协作',
    },
    labels: {
      totalUsers: '用户总数',
      activeUsers: '活跃用户',
      disabledUsers: '禁用用户',
      admins: '管理员账号',
      activeModels: '可用模型',
      providers: '上游供应商',
      announcements: '公告数量',
      totalOrders: '订单总数',
      completedOrders: '已完成订单',
      pendingOrders: '待支付订单',
      failedOrders: '失败订单',
      orderRevenue: '订单收入',
      walletFlow: '钱包流水',
      commissionAmount: '返佣金额',
      totalRequests: '请求总量',
      successRequests: '成功请求',
      failedRequests: '失败请求',
      totalTokens: '总 Token',
      requestCost: '请求成本',
      avgLatency: '平均延迟',
      teams: '团队数量',
      members: '团队成员',
      commissionRecords: '邀请返佣记录',
    },
    actions: [
      { href: '/admin/models', title: '模型管理', desc: '同步上游模型、维护价格和上下架状态。' },
      { href: '/admin/providers', title: '供应商管理', desc: '配置上游地址、密钥和优先级。' },
      { href: '/admin/orders', title: '订单管理', desc: '查看充值与订单状态，便于运营排查。' },
      { href: '/admin/commissions', title: '邀请返佣', desc: '管理邀请关系与奖励流水。' },
      { href: '/admin/finance', title: '财务统计', desc: '查看资金流入、订单收入和余额数据。' },
      { href: '/admin/users', title: '用户管理', desc: '快速定位用户、额度与使用情况。' },
    ],
  },
  en: {
    heroBadge: 'MatrixAPI Admin Console',
    title: 'Admin Overview',
    desc: 'Centralized platform health across users, models, orders, finance, requests, and teams.',
    modelButton: 'Open Model Management',
    realtime: 'Live summary of core platform operations.',
    summary: ['Users', 'API Keys', 'Models', 'Orders', 'Requests', 'Revenue'],
    sections: {
      users: 'Users & Access',
      resources: 'Resources & Channels',
      finance: 'Finance & Orders',
      traffic: 'Traffic & Performance',
      team: 'Teams & Collaboration',
    },
    labels: {
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      disabledUsers: 'Disabled Users',
      admins: 'Admin Accounts',
      activeModels: 'Available Models',
      providers: 'Upstream Providers',
      announcements: 'Announcements',
      totalOrders: 'Total Orders',
      completedOrders: 'Completed Orders',
      pendingOrders: 'Pending Orders',
      failedOrders: 'Failed Orders',
      orderRevenue: 'Order Revenue',
      walletFlow: 'Wallet Flow',
      commissionAmount: 'Commission Amount',
      totalRequests: 'Total Requests',
      successRequests: 'Successful Requests',
      failedRequests: 'Failed Requests',
      totalTokens: 'Total Token',
      requestCost: 'Request Cost',
      avgLatency: 'Average Latency',
      teams: 'Teams',
      members: 'Team Members',
      commissionRecords: 'Invite Commission Records',
    },
    actions: [
      { href: '/admin/models', title: 'Models', desc: 'Sync upstream models and maintain pricing and availability.' },
      { href: '/admin/providers', title: 'Providers', desc: 'Configure upstream endpoints, API keys, and route priority.' },
      { href: '/admin/orders', title: 'Orders', desc: 'Inspect recharge orders and payment status for operations.' },
      { href: '/admin/commissions', title: 'Commissions', desc: 'Manage invite relationships and reward ledger.' },
      { href: '/admin/finance', title: 'Finance', desc: 'Review inflow, order revenue, and balance data.' },
      { href: '/admin/users', title: 'Users', desc: 'Find users, quotas, balances, and usage quickly.' },
    ],
  },
} as const;

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return `¥${numberValue(value).toFixed(2)}`;
}

function formatCompact(value: unknown, locale: 'zh' | 'en') {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 }).format(numberValue(value));
}

export default function AdminOverview() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [stats, setStats] = useState<AdminStats>({});

  useEffect(() => {
    adminApi.getStats().then((response) => setStats(response.data || {})).catch(() => {});
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: text.summary[0], value: stats.users?.total ?? stats.legacy?.users ?? 0, icon: Users, tone: 'cyan' },
      { label: text.summary[1], value: stats.apiKeys?.total ?? 0, icon: Key, tone: 'emerald' },
      { label: text.summary[2], value: stats.models?.total ?? stats.legacy?.models ?? 0, icon: Brain, tone: 'violet' },
      { label: text.summary[3], value: stats.orders?.total ?? stats.legacy?.orders ?? 0, icon: ShoppingCart, tone: 'amber' },
      { label: text.summary[4], value: stats.requests?.total ?? stats.legacy?.totalRequests ?? 0, icon: Activity, tone: 'rose' },
      { label: text.summary[5], value: money(stats.orders?.revenue ?? stats.legacy?.revenue ?? 0), icon: DollarSign, tone: 'slate' },
    ],
    [stats, text],
  );

  const sections = [
    {
      title: text.sections.users,
      icon: Shield,
      items: [
        [text.labels.totalUsers, formatCompact(stats.users?.total, locale)],
        [text.labels.activeUsers, formatCompact(stats.users?.active, locale)],
        [text.labels.disabledUsers, formatCompact(stats.users?.disabled, locale)],
        [text.labels.admins, formatCompact(stats.users?.admins, locale)],
      ],
    },
    {
      title: text.sections.resources,
      icon: Layers3,
      items: [
        ['API Key', formatCompact(stats.apiKeys?.total, locale)],
        [text.labels.activeModels, formatCompact(stats.models?.active, locale)],
        [text.labels.providers, formatCompact(stats.providers?.active, locale)],
        [text.labels.announcements, formatCompact(stats.announcements, locale)],
      ],
    },
    {
      title: text.sections.finance,
      icon: Wallet,
      items: [
        [text.labels.totalOrders, formatCompact(stats.orders?.total, locale)],
        [text.labels.completedOrders, formatCompact(stats.orders?.completed, locale)],
        [text.labels.pendingOrders, formatCompact(stats.orders?.pending, locale)],
        [text.labels.failedOrders, formatCompact(stats.orders?.failed, locale)],
        [text.labels.orderRevenue, money(stats.orders?.revenue)],
        [text.labels.walletFlow, money(stats.wallet?.totalRecharge)],
        [text.labels.commissionAmount, money(stats.commissions?.amount)],
      ],
    },
    {
      title: text.sections.traffic,
      icon: Rocket,
      items: [
        [text.labels.totalRequests, formatCompact(stats.requests?.total, locale)],
        [text.labels.successRequests, formatCompact(stats.requests?.success, locale)],
        [text.labels.failedRequests, formatCompact(stats.requests?.failed, locale)],
        [text.labels.totalTokens, formatCompact(stats.requests?.totalTokens, locale)],
        ['Prompt Token', formatCompact(stats.requests?.promptTokens, locale)],
        ['Completion Token', formatCompact(stats.requests?.completionTokens, locale)],
        [text.labels.requestCost, money(stats.requests?.cost)],
        [text.labels.avgLatency, `${formatCompact(stats.requests?.avgLatency, locale)} ms`],
      ],
    },
    {
      title: text.sections.team,
      icon: MessageSquareText,
      items: [
        [text.labels.teams, formatCompact(stats.teams?.total, locale)],
        [text.labels.members, formatCompact(stats.teams?.members, locale)],
        [text.labels.commissionRecords, formatCompact(stats.commissions?.total, locale)],
        [text.labels.activeModels, formatCompact(stats.models?.active, locale)],
      ],
    },
  ];

  const actionIcons = [Brain, Globe, CreditCard, CheckCircle2, DollarSign, Users];
  const toneMap: Record<string, { bg: string; text: string }> = {
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600' },
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              <LayoutDashboard className="h-4 w-4" />
              {text.heroBadge}
            </div>
            <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{text.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.desc}</p>
          </div>
          <Link
            href="/admin/models"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5"
          >
            {text.modelButton}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const tone = toneMap[card.tone] || toneMap.slate;

          return (
            <div key={card.label} className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
              <div className={`mb-4 inline-flex rounded-2xl p-3 ${tone.bg}`}>
                <Icon className={`h-5 w-5 ${tone.text}`} />
              </div>
              <div className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{card.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">{section.title}</h2>
                  <p className="text-sm text-slate-500">{text.realtime}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                    <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {text.actions.map((item, index) => {
          const Icon = actionIcons[index] || Brain;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/10 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h2>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-600" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
