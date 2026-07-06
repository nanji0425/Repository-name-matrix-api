'use client';

import { Mail, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { MarketingCard, SectionHeader } from '@/components/marketing/MarketingSections';
import { brand } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    eyebrow: 'About',
    title: '关于 MatrixAPI',
    hero: '我们专注于把全球主流大模型统一到一套稳定、简单、兼容 OpenAI 的 API 接口里，帮助开发者更快上线 AI 应用。',
    whoEyebrow: 'Who We Are',
    whoTitle: '我们是谁',
    whoDesc: 'MatrixAPI 是面向开发者和企业的 AI 基础设施与模型聚合平台。我们希望让团队用统一 API 连接更广泛的 AI 能力，同时保持稳定、透明、易管理的使用体验。',
    advantagesEyebrow: 'Our Advantages',
    advantagesTitle: '我们的优势',
    contactEyebrow: 'Contact',
    contactTitle: '联系我们',
    contactDesc: '如需合作、技术支持或账户咨询，请通过邮箱联系我们。',
    contactItems: ['商务合作', '技术支持', '账户问题'],
    cards: [
      ['全模型支持', '持续同步主流文本、图片、视频与语音模型。'],
      ['统一 API 接口', '兼容 OpenAI 调用方式，一行配置即可切换。'],
      ['高可用架构', '结合上游健康检查、监控和备用路由降低故障影响。'],
      ['开发者友好', '提供控制台、模型广场、密钥管理与邀请奖励。'],
    ],
  },
  en: {
    eyebrow: 'About',
    title: 'About MatrixAPI',
    hero: 'We unify leading AI models behind one stable, simple, OpenAI-compatible API so developers can ship AI products faster.',
    whoEyebrow: 'Who We Are',
    whoTitle: 'Who We Are',
    whoDesc: 'MatrixAPI is an AI infrastructure and model aggregation platform for developers and businesses. Teams can connect broader AI capabilities through one API while keeping usage stable, transparent, and manageable.',
    advantagesEyebrow: 'Our Advantages',
    advantagesTitle: 'Why MatrixAPI',
    contactEyebrow: 'Contact',
    contactTitle: 'Contact Us',
    contactDesc: 'For partnerships, technical support, or account questions, contact us by email.',
    contactItems: ['Partnerships', 'Technical Support', 'Account Questions'],
    cards: [
      ['Broad Model Coverage', 'Continuously sync mainstream text, image, video, and audio models.'],
      ['Unified API', 'OpenAI-compatible requests with one endpoint configuration.'],
      ['High Availability', 'Reduce upstream failures with health checks, monitoring, and fallback routing.'],
      ['Developer Friendly', 'Console, model marketplace, key management, and invite rewards included.'],
    ],
  },
} as const;

const icons = [
  <Sparkles key="sparkles" className="h-6 w-6" />,
  <ShieldCheck key="shield" className="h-6 w-6" />,
  <Users key="users" className="h-6 w-6" />,
  <MessageCircle key="message" className="h-6 w-6" />,
];

export default function AboutPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="mx-auto flex min-h-[44vh] max-w-[1200px] flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 text-sm font-black text-slate-500">{text.eyebrow}</div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">{text.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">{text.hero}</p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow={text.whoEyebrow} title={text.whoTitle} />
          <p className="mx-auto max-w-4xl text-center text-lg leading-9 text-slate-400">{text.whoDesc}</p>
        </div>
      </section>

      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow={text.advantagesEyebrow} title={text.advantagesTitle} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {text.cards.map(([title, desc], index) => (
              <MarketingCard key={title} icon={icons[index]} title={title} desc={desc} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.035] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow={text.contactEyebrow} title={text.contactTitle} desc={text.contactDesc} />
          <div className="grid gap-6 md:grid-cols-3">
            {text.contactItems.map((title) => (
              <a key={title} href={`mailto:${brand.email}`} className="group rounded-[24px] border border-white/10 bg-white/[0.045] p-6 text-center transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                <Mail className="mx-auto h-6 w-6 text-cyan-300 transition group-hover:scale-110" />
                <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm text-cyan-300">{brand.email}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
