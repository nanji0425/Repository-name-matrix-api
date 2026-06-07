'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Users, ShoppingCart, DollarSign, Activity, ArrowUpRight, Bell, Brain, Globe, Key, Shield } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, models: 0, totalRequests: 0 });

  useEffect(() => {
    adminApi.getStats().then((response) => setStats(response.data || {})).catch(() => {});
  }, []);

  const cards = [
    { label: '用户总数', value: stats.users, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '订单总数', value: stats.orders, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '累计收入', value: `$${(stats.revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: '活跃模型', value: stats.models, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '请求次数', value: stats.totalRequests || 0, icon: Key, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const actions = [
    { href: '/admin/models', title: '模型目录', desc: '管理模型编码、价格倍率和上下架状态。', icon: Brain },
    { href: '/admin/providers', title: '上游路由', desc: '配置 n1n 上游通道、优先级和故障切换。', icon: Globe },
    { href: '/admin/announcements', title: '公告通知', desc: '向用户控制台发布平台公告和维护提醒。', icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
              <Shield className="h-4 w-4" />
              MatrixAPI 运营中心
            </div>
            <h1 className="text-3xl font-black tracking-tight">管理员总览</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              统一查看用户规模、收入、模型库存、上游通道与平台请求用量。
            </p>
          </div>
          <Link href="/admin/providers" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20">
            管理上游通道
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-900/6 backdrop-blur">
              <div className={`mb-4 inline-flex rounded-xl p-2.5 ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-black text-slate-950">{card.value}</div>
              <div className="text-sm font-medium text-slate-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/10">
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
