'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CTASection, MarketingCard, ModelMarquee, SectionHeader, StepsBlock } from '@/components/marketing/MarketingSections';
import { brand, gatewayProblems, gatewaySolutions, supportedFamilies } from '@/components/marketing/marketingData';

export default function ApiGatewayPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.30),transparent_34%),linear-gradient(180deg,#0b1020,#050506)]">
        <div className="mx-auto grid min-h-[72vh] max-w-[1200px] items-center gap-10 px-6 py-24 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">AI大模型API中转平台</h1>
            <p className="mt-7 text-lg leading-8 text-slate-400">
              通过一个 API 调用 GPT、Claude、Gemini、DeepSeek 等 AI 模型。完全兼容 OpenAI API 格式，几分钟即可完成接入。
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-6 text-sm text-cyan-50 shadow-2xl shadow-black/30">
            <div className="mb-5 font-mono text-cyan-300">curl {brand.baseUrl}/chat/completions</div>
            <pre className="overflow-auto leading-7">{`{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}`}</pre>
          </div>
        </div>
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="为什么需要 AI API 中转" desc="国内 AI 开发者与产品团队常面临的接入难题，我们一站式解决。" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {gatewayProblems.map((item) => {
              const Icon = item.icon;
              return <MarketingCard key={item.title} icon={<Icon className="h-6 w-6" />} title={item.title} desc={item.desc} />;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title="我们的解决方案" desc="企业级 AI API 中转与网关能力，为 AI 开发者与 SaaS 团队打造。" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {gatewaySolutions.map((item) => {
            const Icon = item.icon;
            return <MarketingCard key={item.title} icon={<Icon className="h-6 w-6" />} title={item.title} desc={item.desc} />;
          })}
        </div>
      </section>

      <ModelMarquee title="支持模型" />

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title="兼容 OpenAI API 接口" desc="无需修改代码，直接使用 OpenAI SDK，仅将 Base URL 指向我们的 AI API 平台即可。" />
            <div className="grid gap-3">
              {['无需修改业务代码', '兼容 OpenAI SDK 与 cURL', '支持流式输出与 Function Calling'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="h-4 w-4 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[#0b1220] p-6 text-sm text-cyan-50 shadow-2xl shadow-black/30">
            <div className="mb-5 font-mono text-cyan-300">curl · POST /v1/chat/completions</div>
            <pre className="overflow-auto leading-7">{`curl ${brand.baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $MATRIX_API_KEY" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}</pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <SectionHeader title="四步接入，快速开始" desc="注册即可获取 API Key，立即体验 OpenAI API 中转与多模型聚合。" />
        <StepsBlock />
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.035] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="平台优势" desc="为 AI 应用开发者与 SaaS 团队打造的 AI API 平台，稳定、省心、易用。" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {['低成本调用', '稳定高并发', '多模型聚合', '开发者友好'].map((title) => (
              <MarketingCard key={title} title={title} desc={{
                低成本调用: '透明定价，多模型比价，通过统一采购降低调用成本。',
                稳定高并发: '多地域节点、智能调度，满足 SaaS 与产品化需求。',
                多模型聚合: '一个 API Key 调用 GPT、Claude、Gemini、DeepSeek 等模型。',
                开发者友好: '完整文档、SDK 示例、状态观测与后台支持。',
              }[title] || ''} />
            ))}
          </div>
        </div>
      </section>

      <CTASection title="立即开始使用 AI API" desc="注册即获 API Key，稳定调用 GPT、Claude、Gemini、DeepSeek 等大模型。OpenAI API 中转，一键接入。" button="获取 API Key" />
    </MarketingLayout>
  );
}
