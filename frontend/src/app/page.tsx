'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CodeTabs, CTASection, MarketingCard, ModelMarquee, SectionHeader, StepsBlock } from '@/components/marketing/MarketingSections';
import { developerFeatures, infrastructureCards, newsPosts, solutionCards } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const infrastructureLinks = ['/api-gateway', '/docs', '/api-gateway', '/dashboard/balance'];
const solutionLinks = ['/solutions', '/tools', '/solutions', '/docs', '/tools'];

const copy = {
  zh: {
    status: 'API Gateway 服务实时可用',
    titleTop: '全球 AI 大模型',
    titleBottom: 'API 聚合平台',
    desc: '统一 API 调用 GPT、Claude、Gemini、DeepSeek、Llama 等顶级 AI 模型。完全兼容 OpenAI API，一行代码即可无缝切换全球智慧。',
    marquee: '一点接入，驱动无限可能',
    infraTitle: '为你打造的基础设施',
    infraDesc: '不仅提供模型接口，我们还提供支持海量并发的企业级 AI 中台架构。',
    devTitle: '为开发者而生',
    devDesc: '极简、优雅的接入体验。无论使用哪种语言，都像使用熟悉的 OpenAI SDK。',
    stepsTitle: '只需四步，开启 AI 建设之路',
    scenesTitle: '驱动全链路 AI 场景',
    scenesDesc: '我们的基础设施可高度适配各类应用场景的并发与响应需求。',
    newsTitle: 'AI 技术与生态资讯',
    newsDesc: '掌握大语言模型的第一手开发实践与商业洞察。',
    moreNews: '查看更多文章',
  },
  en: {
    status: 'API Gateway Live',
    titleTop: 'Global AI Models',
    titleBottom: 'Unified API Platform',
    desc: 'Call GPT, Claude, Gemini, DeepSeek, Llama, and other leading AI models through one OpenAI-compatible API.',
    marquee: 'Connect once, unlock more',
    infraTitle: 'Infrastructure Built For You',
    infraDesc: 'Beyond model endpoints, MatrixAPI provides enterprise AI gateway infrastructure for high-concurrency workloads.',
    devTitle: 'Built For Developers',
    devDesc: 'A simple integration experience that feels like the OpenAI SDK you already know.',
    stepsTitle: 'Start Building AI In Four Steps',
    scenesTitle: 'Power Full-stack AI Scenarios',
    scenesDesc: 'Our infrastructure adapts to the concurrency and response needs of different AI applications.',
    newsTitle: 'AI Technology And Ecosystem News',
    newsDesc: 'Follow first-hand development practices and business insights from large language models.',
    moreNews: 'Read More',
  },
} as const;

export default function HomePage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <MarketingLayout>
      {/* Hero Section - 紫粉渐变 */}
      <section className="hero-section relative mx-auto flex min-h-[85vh] max-w-[1200px] flex-col items-center justify-center px-6 pb-20 pt-40 text-center md:pb-32 md:pt-48">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(168,85,247,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.08)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
        <Link href="/api-gateway" className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-4 py-2 text-xs font-bold text-purple-700 shadow-soft backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          {text.status}
        </Link>
        <h1 className="hero-title max-w-5xl text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          {text.titleTop}
          <br />
          {text.titleBottom}
        </h1>
        <p className="hero-description mt-8 max-w-3xl text-lg font-semibold leading-8">{text.desc}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="button-primary px-8 py-4 text-base">
            立即开始
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/docs" className="button-secondary px-8 py-4 text-base">
            查看文档
          </Link>
        </div>
      </section>

      <ModelMarquee title={text.marquee} />

      {/* Infrastructure Section */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title={text.infraTitle} desc={text.infraDesc} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {infrastructureCards[locale].map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={infrastructureLinks[index]}
                className="group console-card hover:border-purple-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Developer Section */}
      <section className="w-full border-y border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/30 py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title={text.devTitle} desc={text.devDesc} />
            <div className="grid gap-4">
              {developerFeatures[locale].map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href="/docs" className="console-card hover:border-purple-300">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{feature.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <CodeTabs />
        </div>
      </section>

      {/* Steps Section */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title={text.stepsTitle} />
        <StepsBlock />
      </section>

      {/* Solutions Section */}
      <section className="w-full border-y border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/30 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title={text.scenesTitle} desc={text.scenesDesc} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {solutionCards[locale].map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={solutionLinks[index]}
                  className="console-card hover:border-purple-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader center={false} title={text.newsTitle} desc={text.newsDesc} />
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700">
            {text.moreNews} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {newsPosts.map((post) => {
            const localizedPost = post[locale];
            return (
            <Link key={post.slug} href={`/news/${post.slug}`} className="console-card hover:border-purple-300">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                <CheckCircle className="h-3.5 w-3.5" />
                {localizedPost.category}
              </div>
              <div className="mb-3 text-xs font-bold text-gray-500">{localizedPost.date}</div>
              <h3 className="text-lg font-bold leading-7 text-gray-900 dark:text-white">{localizedPost.title}</h3>
            </Link>
            );
          })}
        </div>
      </section>

      <CTASection />
    </MarketingLayout>
  );
}
