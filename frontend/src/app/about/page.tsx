'use client';

import { Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { MarketingCard, SectionHeader } from '@/components/marketing/MarketingSections';
import { brand } from '@/components/marketing/marketingData';

export default function AboutPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="mx-auto flex min-h-[44vh] max-w-[1200px] flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 text-sm font-black text-slate-500">About</div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">关于 MatrixAPI</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            构建全球 AI 模型接入与 AI 创作工具平台，让开发者和企业更轻松地使用 AI 能力。
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Who We Are" title="我们是谁" />
          <p className="mx-auto max-w-4xl text-center text-lg leading-9 text-slate-400">
            MatrixAPI 是一个专注于 AI 基础设施和 AI 工具平台的团队。我们致力于帮助开发者和企业更简单地接入全球 AI 模型，并通过统一的 API 接口调用不同 AI 服务。
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Our Advantages" title="我们的优势" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MarketingCard icon={<Sparkles className="h-6 w-6" />} title="全球 AI 模型支持" desc="接入 GPT、Claude、Gemini、DeepSeek 等主流模型。" />
            <MarketingCard icon={<ShieldCheck className="h-6 w-6" />} title="统一 API 接口" desc="完全兼容 OpenAI API，一行代码即可切换。" />
            <MarketingCard icon={<Users className="h-6 w-6" />} title="稳定高可用架构" desc="多地域节点和智能路由保障服务稳定。" />
            <MarketingCard icon={<Mail className="h-6 w-6" />} title="开发者友好" desc="完整文档与示例，快速上手。" />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Our Mission" title="我们的使命" />
          <p className="mx-auto max-w-4xl text-center text-lg leading-9 text-slate-400">
            我们相信 AI 将改变未来的软件开发方式。MatrixAPI 希望成为开发者和企业连接 AI 能力的重要基础设施，让 AI 技术能够被更广泛地应用。
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Contact" title="联系我们" desc="如果你希望合作或了解更多信息，可以通过以下方式联系我们。" />
          <div className="grid gap-6 md:grid-cols-3">
            {['邮箱', '商务合作', '技术支持'].map((title) => (
              <a key={title} href={`mailto:${brand.email}`} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 text-center transition hover:border-cyan-300/30">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm text-cyan-300">{brand.email}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
