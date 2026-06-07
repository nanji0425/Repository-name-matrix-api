'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { MarketingCard, SectionHeader } from '@/components/marketing/MarketingSections';
import { toolCards } from '@/components/marketing/marketingData';

export default function ToolsPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="mx-auto flex min-h-[44vh] max-w-[1200px] flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 text-sm font-black text-slate-500">AI 创作平台</div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">AI 创作工具平台</h1>
          <p className="mt-6 text-xl font-semibold text-slate-400">使用 AI 轻松生成图片、视频、音频和文本内容。</p>
          <Link href="/dashboard/playground" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
            立即使用 AI 工具
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="AIGCTOOL 核心能力" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {toolCards.map((card) => {
              const Icon = card.icon;
              return <MarketingCard key={card.title} icon={<Icon className="h-6 w-6" />} title={card.title} desc={card.desc} />;
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="平台优势" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['支持多种 AI 模型', '集成业界领先 AI 模型，满足不同创作需求。'],
              ['高质量图像生成', '专业级 AI 图片生成，细节丰富、风格多样。'],
              ['视频创作工具', '强大的 AI 视频生成能力，轻松创作短视频。'],
              ['多模态 AI 能力', '文本、图像、视频、音频一体化创作体验。'],
            ].map(([title, desc]) => <MarketingCard key={title} title={title} desc={desc} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="使用流程" />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['进入 AIGCTOOL', '访问平台，注册或登录账号'],
              ['选择 AI 工具', '根据需求选择聊天、图片、视频或音频'],
              ['开始创作内容', '输入提示词，AI 助您完成创作'],
            ].map(([title, desc], index) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">{index + 1}</div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-20 text-center">
        <h2 className="text-3xl font-black text-white">开始使用 AIGCTOOL</h2>
        <p className="mt-4 text-slate-400">专业的 AI 创作平台，让创意触手可及。</p>
        <Link href="/dashboard/playground" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
          进入 AI 创作平台
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </MarketingLayout>
  );
}
