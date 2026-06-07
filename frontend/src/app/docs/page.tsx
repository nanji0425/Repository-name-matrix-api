'use client';

import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CodeTabs, SectionHeader } from '@/components/marketing/MarketingSections';
import { developerFeatures } from '@/components/marketing/marketingData';

export default function DocsPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-32">
        <h1 className="text-5xl font-black tracking-tight text-white">开发文档</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          极简、优雅的接入体验。全系模型 100% 兼容 OpenAI 格式，无缝接入。
        </p>
      </section>
      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title="为开发者而生" desc="无论您使用哪种语言，这看起来都像极了您熟悉的 OpenAI SDK。" />
            <div className="grid gap-4">
              {developerFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <CodeTabs />
        </div>
      </section>
    </MarketingLayout>
  );
}
