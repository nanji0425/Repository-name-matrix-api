'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  Activity,
  ArrowUpRight,
  Bell,
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

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return `¥${numberValue(value).toFixed(2)}`;
}

function formatCompact(value: unknown) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(numberValue(value));
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats>({});

  useEffect(() => {
    adminApi.getStats().then((response) => setStats(response.data || {})).catch(() => {});
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: '用户总数', value: stats.users?.total ?? stats.legacy?.users ?? 0, icon: Users, tone: 'cyan' },
      { label: 'API Key 总数', value: stats.apiKeys?.total ?? 0, icon: Key, tone: 'emerald' },
      { label: '模型总数', value: stats.models?.total ?? stats.legacy?.models ?? 0, icon: Brain, tone: 'violet' },
      { label: '订单总数', value: stats.orders?.total ?? stats.legacy?.orders ?? 0, icon: ShoppingCart, tone: 'amber' },
      { label: '请求总量', value: stats.requests?.total ?? stats.legacy?.totalRequests ?? 0, icon: Activity, tone: 'rose' },
      { label: '累计收入', value: money(stats.orders?.revenue ?? stats.legacy?.revenue ?? 0), icon: DollarSign, tone: 'slate' },
    ],
    [stats],
  );

  const sections = [
    {
      title: '用户与权限',
      icon: Shield,
      items: [
        ['用户总数', formatCompact(stats.users?.total)],
        ['活跃用户', formatCompact(stats.users?.active)],
        ['禁用用户', formatCompact(stats.users?.disabled)],
        ['管理员账号', formatCompact(stats.users?.admins)],
      ],
    },
    {
      title: '资源与渠道',
      icon: Layers3,
      items: [
        ['API Key', formatCompact(stats.apiKeys?.total)],
        ['可用模型', formatCompact(stats.models?.active)],
        ['上游供应商', formatCompact(stats.providers?.active)],
        ['公告数量', formatCompact(stats.announcements)],
      ],
    },
    {
      title: '资金与订单',
      icon: Wallet,
      items: [
        ['订单总数', formatCompact(stats.orders?.total)],
        ['已完成订单', formatCompact(stats.orders?.completed)],
        ['待支付订单', formatCompact(stats.orders?.pending)],
        ['失败订单', formatCompact(stats.orders?.failed)],
        ['订单收入', money(stats.orders?.revenue)],
        ['钱包流水', money(stats.wallet?.totalRecharge)],
        ['返佣金额', money(stats.commissions?.amount)],
      ],
    },
    {
      title: '流量与性能',
      icon: Rocket,
      items: [
        ['请求总量', formatCompact(stats.requests?.total)],
        ['成功请求', formatCompact(stats.requests?.success)],
        ['失败请求', formatCompact(stats.requests?.failed)],
        ['总 Token', formatCompact(stats.requests?.totalTokens)],
        ['Prompt Token', formatCompact(stats.requests?.promptTokens)],
        ['Completion Token', formatCompact(stats.requests?.completionTokens)],
        ['请求成本', money(stats.requests?.cost)],
        ['平均延迟', `${formatCompact(stats.requests?.avgLatency)} ms`],
      ],
    },
    {
      title: '团队与协作',
      icon: MessageSquareText,
      items: [
        ['团队数量', formatCompact(stats.teams?.total)],
        ['团队成员', formatCompact(stats.teams?.members)],
        ['邀请返佣记录', formatCompact(stats.commissions?.total)],
        ['活跃模型', formatCompact(stats.models?.active)],
      ],
    },
  ];

  const actions = [
    { href: '/admin/models', title: '模型管理', desc: '同步上游模型、维护价格和上下架状态。', icon: Brain },
    { href: '/admin/providers', title: '供应商管理', desc: '配置上游地址、密钥和优先级。', icon: Globe },
    { href: '/admin/orders', title: '订单管理', desc: '查看充值与订单状态，便于运营排查。', icon: CreditCard },
    { href: '/admin/commissions', title: '邀请返佣', desc: '管理邀请关系与奖励流水。', icon: CheckCircle2 },
    { href: '/admin/finance', title: '财务统计', desc: '查看资金流入、订单收入和余额数据。', icon: DollarSign },
    { href: '/admin/users', title: '用户管理', desc: '快速定位用户、额度与使用情况。', icon: Users },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              <LayoutDashboard className="h-4 w-4" />
              MatrixAPI 管理控制台
            </div>
            <h1 className="text-3xl font-black tracking-tight lg:text-4xl">管理员总览</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              这里集中展示平台的用户、模型、订单、资金、请求与团队数据，方便你快速判断平台是否健康。
            </p>
          </div>
          <Link
            href="/admin/models"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5"
          >
            前往模型管理
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const toneMap: Record<string, { bg: string; text: string }> = {
            cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
            violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
            rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
            slate: { bg: 'bg-slate-50', text: 'text-slate-600' },
          };
          const tone = toneMap[card.tone] || toneMap.slate;

          return (
            <div key={card.label} className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
              <div className={`mb-4 inline-flex rounded-2xl p-3 ${tone.bg}`}>
                <Icon className={`h-5 w-5 ${tone.text}`} />
              </div>
              <div className="text-3xl font-black tracking-tight text-slate-950">{card.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
                  <p className="text-sm text-slate-500">实时汇总平台核心运营数据。</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                    <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
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
