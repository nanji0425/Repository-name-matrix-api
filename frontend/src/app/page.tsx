'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CodeTabs, CTASection, MarketingCard, ModelMarquee, SectionHeader, StepsBlock } from '@/components/marketing/MarketingSections';
import { developerFeatures, infrastructureCards, newsPosts, solutionCards } from '@/components/marketing/marketingData';

export default function HomePage() {
  return (
    <MarketingLayout>
      <section className="relative mx-auto flex min-h-[85vh] max-w-[1200px] flex-col items-center justify-center px-6 pb-20 pt-40 text-center md:pb-32 md:pt-48">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-50" />
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black text-white shadow-xl shadow-black/30">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
          API Gateway 服务实时可用
        </div>
        <h1 className="max-w-5xl text-6xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          全球 AI 大模型{' '}
          <br />
          API 聚合平台
        </h1>
        <p className="mt-8 max-w-3xl text-lg font-semibold leading-8 text-slate-400">
          统一 API 调用 GPT、Claude、Gemini、DeepSeek、Llama 等顶级 AI 模型。完全兼容 OpenAI API，一行代码即可无缝切换全球智慧。
        </p>
      </section>

      <ModelMarquee title="一点接入，驱动无限可能" />

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title="为您打造的基础设施" desc="不仅仅提供模型接口，我们提供支持海量并发的企业级 AI 中台架构。" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {infrastructureCards.map((card) => {
            const Icon = card.icon;
            return <MarketingCard key={card.title} icon={<Icon className="h-6 w-6" />} title={card.title} desc={card.desc} />;
          })}
        </div>
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title="为开发者而生" desc="极简、优雅的接入体验。无论您使用哪种语言，这看起来都像极了您熟悉的 OpenAI SDK。" />
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

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title="只需四步，开启 AI 建设之路" />
        <StepsBlock />
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="驱动全链路 AI 场景" desc="我们的基础架构可高度适配各类应用场景的并发与响应需求。" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {solutionCards.map((card) => {
              const Icon = card.icon;
              return <MarketingCard key={card.title} icon={<Icon className="h-6 w-6" />} title={card.title} desc={card.desc} />;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader center={false} title="AI 技术与生态资讯" desc="掌握大语言模型的第一手开发实践与商业洞察。" />
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
            查看更多文章 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {newsPosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-300">
                <CheckCircle className="h-3.5 w-3.5" />
                {post.category}
              </div>
              <div className="mb-3 text-xs font-bold text-slate-500">{post.date}</div>
              <h3 className="text-lg font-black leading-7 text-white">{post.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      <CTASection />
    </MarketingLayout>
  );
}
