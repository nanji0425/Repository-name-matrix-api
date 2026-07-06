'use client';

import Link from 'next/link';
import { CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';

const plans = [
  { name: '入门版', price: '¥50', quota: '55', duration: '1 个月', popular: false },
  { name: '标准版', price: '¥100', quota: '111', duration: '1 个月', popular: true },
  { name: '旗舰版', price: '¥200', quota: '222', duration: '1 个月', popular: false },
];

export default function SubscriptionPage() {
  return (
    <ConsolePage className="pb-24">
      <div>
        <h1 className="text-3xl font-black text-white">订阅计划</h1>
        <p className="mt-2 text-sm text-slate-400">选择适合你的充值方案，直接跳转到余额充值页完成支付。</p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`console-card relative p-6 ${plan.popular ? 'border-cyan-300/40 bg-cyan-950/20' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
                推荐
              </div>
            )}
            <div className="flex items-center gap-3 text-white">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-black">{plan.name}</h2>
            </div>
            <div className="mt-4 text-3xl font-black text-white">{plan.price}</div>
            <div className="mt-2 text-sm text-slate-400">到账额度 ¥{plan.quota}，有效期 {plan.duration}</div>
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 全模型可用</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 支持自动充值记录</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 可与活动奖励叠加</div>
            </div>
            <Link href="/dashboard/balance" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-slate-950 transition hover:bg-cyan-100">
              <CreditCard className="h-4 w-4" />
              立即充值
            </Link>
          </div>
        ))}
      </div>
    </ConsolePage>
  );
}
