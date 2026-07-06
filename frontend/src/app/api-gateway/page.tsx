'use client';

import { CheckCircle } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CTASection, MarketingCard, ModelMarquee, SectionHeader, StepsBlock } from '@/components/marketing/MarketingSections';
import { brand, gatewayProblems, gatewaySolutions } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: 'AI 大模型 API 中转平台',
    desc: '通过一个 API 调用 GPT、Claude、Gemini、DeepSeek 等 AI 模型。完全兼容 OpenAI API 格式，几分钟即可完成接入。',
    problemsTitle: '为什么需要 AI API 中转',
    problemsDesc: '国内 AI 开发者与产品团队常面临的接入难题，我们一站式解决。',
    solutionsTitle: '我们的解决方案',
    solutionsDesc: '企业级 AI API 中转与网关能力，为 AI 开发者与 SaaS 团队打造。',
    modelsTitle: '支持模型',
    compatibleTitle: '兼容 OpenAI API 接口',
    compatibleDesc: '无需修改代码，直接使用 OpenAI SDK，仅将 Base URL 指向我们的 AI API 平台即可。',
    compatibleItems: ['无需修改业务代码', '兼容 OpenAI SDK 与 cURL', '支持流式输出与 Function Calling'],
    stepsTitle: '四步接入，快速开始',
    stepsDesc: '注册即可获取 API Key，立即体验 OpenAI API 中转与多模型聚合。',
    advantagesTitle: '平台优势',
    advantagesDesc: '为 AI 应用开发者与 SaaS 团队打造的 AI API 平台，稳定、省心、易用。',
    advantages: [
      ['低成本调用', '透明定价，多模型比价，通过统一采购降低调用成本。'],
      ['稳定高并发', '多地域节点、智能调度，满足 SaaS 与产品化需求。'],
      ['多模型聚合', '一个 API Key 调用 GPT、Claude、Gemini、DeepSeek 等模型。'],
      ['开发者友好', '完整文档、SDK 示例、状态观测与后台支持。'],
    ],
    ctaTitle: '立即开始使用 AI API',
    ctaDesc: '注册即获 API Key，稳定调用 GPT、Claude、Gemini、DeepSeek 等大模型。OpenAI API 中转，一键接入。',
    ctaButton: '获取 API Key',
  },
  en: {
    title: 'AI Model API Gateway',
    desc: 'Call GPT, Claude, Gemini, DeepSeek, and other models through one OpenAI-compatible API. Connect in minutes.',
    problemsTitle: 'Why Use An AI API Gateway',
    problemsDesc: 'We remove the access, billing, routing, and observability issues teams often face when using multiple model providers.',
    solutionsTitle: 'Our Solution',
    solutionsDesc: 'Enterprise AI API relay and gateway capabilities for developers, SaaS teams, and AI products.',
    modelsTitle: 'Supported Models',
    compatibleTitle: 'OpenAI API Compatible',
    compatibleDesc: 'Keep your existing OpenAI SDK usage and point the Base URL to MatrixAPI.',
    compatibleItems: ['No business-code rewrite', 'Compatible with OpenAI SDK and cURL', 'Streaming output and Function Calling support'],
    stepsTitle: 'Connect In Four Steps',
    stepsDesc: 'Register, create an API key, and start using multi-model API relay immediately.',
    advantagesTitle: 'Platform Advantages',
    advantagesDesc: 'A stable, cost-transparent, developer-friendly AI API platform for production teams.',
    advantages: [
      ['Lower Cost', 'Transparent pricing and multi-model routing help reduce model usage cost.'],
      ['Stable Concurrency', 'Health checks and routing support high-concurrency SaaS workloads.'],
      ['Multi-model Access', 'Use one API key to call GPT, Claude, Gemini, DeepSeek, and more.'],
      ['Developer Friendly', 'Complete docs, SDK samples, status visibility, and admin support.'],
    ],
    ctaTitle: 'Start Using The AI API',
    ctaDesc: 'Create an API key and call GPT, Claude, Gemini, DeepSeek, and other models through one endpoint.',
    ctaButton: 'Get API Key',
  },
} as const;

export default function ApiGatewayPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.30),transparent_34%),linear-gradient(180deg,#0b1020,#050506)]">
        <div className="mx-auto grid min-h-[72vh] max-w-[1200px] items-center gap-10 px-6 py-24 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">{text.title}</h1>
            <p className="mt-7 text-lg leading-8 text-slate-400">{text.desc}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-6 text-sm text-cyan-50 shadow-2xl shadow-black/30">
            <div className="mb-5 font-mono text-cyan-300">curl {brand.baseUrl}/chat/completions</div>
            <pre className="overflow-auto leading-7">{`{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}`}</pre>
          </div>
        </div>
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title={text.problemsTitle} desc={text.problemsDesc} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {gatewayProblems[locale].map((item) => {
              const Icon = item.icon;
              return <MarketingCard key={item.title} icon={<Icon className="h-6 w-6" />} title={item.title} desc={item.desc} />;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title={text.solutionsTitle} desc={text.solutionsDesc} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {gatewaySolutions[locale].map((item) => {
            const Icon = item.icon;
            return <MarketingCard key={item.title} icon={<Icon className="h-6 w-6" />} title={item.title} desc={item.desc} />;
          })}
        </div>
      </section>

      <ModelMarquee title={text.modelsTitle} />

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title={text.compatibleTitle} desc={text.compatibleDesc} />
            <div className="grid gap-3">
              {text.compatibleItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="h-4 w-4 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-6 text-sm text-cyan-50 shadow-2xl shadow-black/30">
            <div className="mb-5 font-mono text-cyan-300">POST /v1/chat/completions</div>
            <pre className="overflow-auto leading-7">{`curl ${brand.baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $MATRIX_API_KEY" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}</pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title={text.stepsTitle} desc={text.stepsDesc} />
        <StepsBlock />
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title={text.advantagesTitle} desc={text.advantagesDesc} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {text.advantages.map(([title, desc]) => <MarketingCard key={title} title={title} desc={desc} />)}
          </div>
        </div>
      </section>

      <CTASection title={text.ctaTitle} desc={text.ctaDesc} button={text.ctaButton} />
    </MarketingLayout>
  );
}
