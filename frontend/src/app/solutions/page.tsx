'use client';

import MarketingLayout from '@/components/marketing/MarketingLayout';
import { MarketingCard } from '@/components/marketing/MarketingSections';
import { solutionCards } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '解决方案',
    desc: '驱动全链路 AI 场景，基础架构可高度适配各类应用场景的并发与响应需求。',
  },
  en: {
    title: 'Solutions',
    desc: 'Power full-stack AI scenarios with infrastructure designed for concurrency, routing, and response reliability.',
  },
} as const;

export default function SolutionsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-32">
        <h1 className="text-5xl font-black tracking-tight text-white">{text.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">{text.desc}</p>
      </section>
      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
          {solutionCards[locale].map((card) => {
            const Icon = card.icon;
            return <MarketingCard key={card.title} icon={<Icon className="h-6 w-6" />} title={card.title} desc={card.desc} />;
          })}
        </div>
      </section>
    </MarketingLayout>
  );
}
