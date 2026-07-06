'use client';

import Link from 'next/link';
import { CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '订阅计划',
    desc: '选择适合你的充值方案，直接跳转到余额充值页完成支付宝付款。',
    recommended: '推荐',
    quotaPrefix: '到账额度',
    durationPrefix: '有效期',
    features: ['全模型可用', '支持自动充值记录', '可与活动奖励叠加'],
    cta: '立即充值',
    plans: [
      { name: '入门版', price: '¥50', quota: '¥55', duration: '1 个月', popular: false },
      { name: '标准版', price: '¥100', quota: '¥111', duration: '1 个月', popular: true },
      { name: '旗舰版', price: '¥200', quota: '¥222', duration: '1 个月', popular: false },
    ],
  },
  en: {
    title: 'Recharge Plans',
    desc: 'Choose a recharge package and continue to the balance page to pay with Alipay.',
    recommended: 'Recommended',
    quotaPrefix: 'Credit',
    durationPrefix: 'Valid for',
    features: ['All models available', 'Automatic recharge records', 'Stacks with activity rewards'],
    cta: 'Recharge Now',
    plans: [
      { name: 'Starter', price: '¥50', quota: '¥55', duration: '1 month', popular: false },
      { name: 'Standard', price: '¥100', quota: '¥111', duration: '1 month', popular: true },
      { name: 'Flagship', price: '¥200', quota: '¥222', duration: '1 month', popular: false },
    ],
  },
} as const;

export default function SubscriptionPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <ConsolePage className="pb-24">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {text.plans.map((plan) => (
          <div key={plan.name} className={`console-card relative p-6 ${plan.popular ? 'border-cyan-300/40 bg-cyan-50/70 dark:bg-cyan-950/20' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
                {text.recommended}
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-950 dark:text-white">
              <Sparkles className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
              <h2 className="text-xl font-black">{plan.name}</h2>
            </div>
            <div className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{plan.price}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.quotaPrefix} {plan.quota}, {text.durationPrefix} {plan.duration}</div>
            <div className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {text.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> {feature}</div>
              ))}
            </div>
            <Link href="/dashboard/balance" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100">
              <CreditCard className="h-4 w-4" />
              {text.cta}
            </Link>
          </div>
        ))}
      </div>
    </ConsolePage>
  );
}
