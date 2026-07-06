'use client';

import { MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { MarketingCard, SectionHeader } from '@/components/marketing/MarketingSections';

export default function AboutPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="mx-auto flex min-h-[44vh] max-w-[1200px] flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 text-sm font-black text-slate-500">About</div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">关于 MatrixAPI</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            我们专注于把全球主流大模型统一到一套简单、稳定、兼容 OpenAI 的 API 接口里，帮助开发者更快上线。
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Who We Are" title="我们是谁" />
          <p className="mx-auto max-w-4xl text-center text-lg leading-9 text-slate-400">
            MatrixAPI 是一个聚焦 AI 基础设施与模型聚合的平台。我们希望让开发者和企业用统一的 API 连接更广泛的 AI 能力，同时保持足够高的稳定性、透明度和易用性。
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Our Advantages" title="我们的优势" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MarketingCard icon={<Sparkles className="h-6 w-6" />} title="全模型支持" desc="持续同步主流文本、图像、视频与语音模型。" />
            <MarketingCard icon={<ShieldCheck className="h-6 w-6" />} title="统一 API 接口" desc="兼容 OpenAI 调用方式，一行代码即可切换。" />
            <MarketingCard icon={<Users className="h-6 w-6" />} title="高可用架构" desc="配合上游同步和监控，降低单点故障影响。" />
            <MarketingCard icon={<MessageCircle className="h-6 w-6" />} title="开发者友好" desc="提供控制台、模型广场、密钥管理与邀请奖励。" />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Contact" title="联系我们" desc="如需合作或咨询，请通过以下 QQ 联系我们。" />
          <div className="grid gap-6 md:grid-cols-3">
            {['商务合作', '技术支持', '账户问题'].map((title) => (
              <a key={title} href="https://wpa.qq.com/msgrd?v=3&uin=3315419516&site=qq&menu=yes" target="_blank" rel="noreferrer" className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 text-center transition hover:border-cyan-300/30">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm text-cyan-300">3315419516</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
