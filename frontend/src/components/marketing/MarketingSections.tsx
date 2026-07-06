'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { ArrowRight, CheckCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { codeSamples, heroModels, steps } from './marketingData';

export function SectionHeader({ eyebrow, title, desc, center = true }: { eyebrow?: string; title: string; desc?: string; center?: boolean }) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} mb-10 max-w-3xl`}>
      {eyebrow && <div className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</div>}
      <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-400">{desc}</p>}
    </div>
  );
}

export function MarketingCard({ icon, title, desc, children, href }: { icon?: ReactNode; title: string; desc: string; children?: ReactNode; href?: string }) {
  const className = 'tech-surface group rounded-[24px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]';
  const content = (
    <>
      {icon && <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20 transition group-hover:bg-cyan-300 group-hover:text-slate-950">{icon}</div>}
      <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{desc}</p>
      {children}
    </>
  );

  if (href) return <Link href={href} className={`${className} block`}>{content}</Link>;
  return <div className={className}>{content}</div>;
}

export function ModelMarquee({ title }: { title?: string }) {
  return (
    <section className="w-full overflow-hidden border-y border-white/10 bg-white/[0.035] py-12 backdrop-blur-md">
      {title && <h2 className="mb-6 text-center text-sm font-black text-slate-500 dark:text-slate-400">{title}</h2>}
      <div className="marquee-track flex w-max gap-3">
        {[...heroModels, ...heroModels].map((model, index) => (
          <Link key={`${model}-${index}`} href="/models" className="tech-surface rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-slate-800 dark:text-slate-200">
            {model}
          </Link>
        ))}
      </div>
      <style jsx>{`
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

export function CodeTabs() {
  const tabs = Object.keys(codeSamples) as Array<keyof typeof codeSamples>;
  const [active, setActive] = useState<keyof typeof codeSamples>('Python');
  const code = codeSamples[active];

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success('代码已复制');
  };

  return (
    <div className="tech-surface overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActive(tab)} className={`rounded-full px-4 py-2 text-xs font-black transition ${active === tab ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/14 hover:text-white">
          <Copy className="h-3.5 w-3.5" />
          复制
        </button>
      </div>
      <pre className="min-h-[310px] overflow-auto p-6 text-sm leading-7 text-cyan-50">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function StepsBlock() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((step, index) => (
        <Link key={step.title} href={index === 0 ? '/register' : index === 1 ? '/dashboard/api-keys' : index === 2 ? '/docs' : '/solutions'} className="tech-surface relative rounded-[24px] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-black/20">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
            {index + 1}
          </div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{step.desc}</p>
        </Link>
      ))}
    </div>
  );
}

export function CTASection({ title = '开始使用 AI API 构建你的应用', desc = '无需漫长配置，立即用同一个标准接口整合全球大模型能力。', button = '立即获取 API Key' }: { title?: string; desc?: string; button?: string }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 pb-20">
      <div className="tech-surface overflow-hidden rounded-[32px] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_30%),linear-gradient(135deg,#101827,#06070b)] p-8 text-white shadow-2xl shadow-black/30 sm:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-300/12 px-4 py-2 text-sm font-black text-cyan-200">
              <CheckCircle className="h-4 w-4" />
              OpenAI 兼容 / 多模型聚合 / 统一计费
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{desc}</p>
          </div>
          <Link href="/dashboard/api-keys" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-cyan-100">
            {button}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
