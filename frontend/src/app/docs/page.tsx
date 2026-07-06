'use client';

import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CodeTabs, SectionHeader } from '@/components/marketing/MarketingSections';
import { brand, developerFeatures } from '@/components/marketing/marketingData';
import { ArrowRight, BookOpen, CheckCircle2, Code2, Copy, Download, KeyRound, PlugZap, TerminalSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const quickNav = [
  { title: '快速开始', href: '#quickstart' },
  { title: '接口地址', href: '#endpoint' },
  { title: '客户端导入', href: '#clients' },
  { title: '开发工具', href: '#tools' },
  { title: '常见问题', href: '#faq' },
];

const clients = [
  'Cherry Studio',
  'AionUI',
  'DeepChat',
  'Lobe Chat',
  'OpenCat',
  'Chatbox',
  'NextChat',
  'Cursor',
  'Continue',
  'Cline',
  'Roo Code',
  'Claude Code',
  'Codex',
  'VS Code',
];

const toolConfigs = [
  {
    title: 'Codex / OpenAI SDK',
    icon: TerminalSquare,
    code: `OPENAI_BASE_URL=${brand.baseUrl}\nOPENAI_API_KEY=sk-你的密钥`,
  },
  {
    title: 'Claude Code',
    icon: Code2,
    code: `ANTHROPIC_BASE_URL=${brand.baseUrl}\nANTHROPIC_AUTH_TOKEN=sk-你的密钥`,
  },
  {
    title: 'VS Code / Cline / Roo Code',
    icon: PlugZap,
    code: JSON.stringify({ provider: 'openai-compatible', baseUrl: brand.baseUrl, apiKey: 'sk-你的密钥', model: 'gpt-4o-mini' }, null, 2),
  },
];

const faqs = [
  ['是否兼容 OpenAI SDK？', '兼容。将 SDK 的 baseURL 指向 MatrixAPI，并使用你的 API Key 即可。'],
  ['为什么建议按项目创建不同令牌？', '便于分别限制额度、查看日志、禁用异常项目，也能降低密钥泄露后的影响范围。'],
  ['充值后多久到账？', '支付宝支付成功后由 ZPay 异步回调入账，通常会在数秒内完成。'],
  ['能否导入到桌面客户端？', '可以。控制台的令牌页面提供 Cherry Studio、AionUI、DeepChat、Lobe Chat、OpenCat、Cursor、Continue、Cline、Roo Code 等配置。'],
];

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success('已复制');
}

export default function DocsPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-32">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">开发文档</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              极简、优雅的接入体验。全系模型兼容 OpenAI 格式，支持一键导入常用 AI 客户端。
            </p>
          </div>
          <div className="tech-surface rounded-2xl border border-white/10 p-4">
            <div className="text-sm font-black text-slate-950 dark:text-white">文档导航</div>
            <div className="mt-3 grid gap-2">
              {quickNav.map((item) => (
                <a key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-cyan-300/10 hover:text-cyan-300 dark:text-slate-400">
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="quickstart" className="w-full border-y border-white/10 bg-white/[0.035] py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader center={false} title="为开发者而生" desc="无需重写业务代码，只要替换 Base URL 和 API Key，就能接入多模型能力。" />
            <div className="grid gap-4">
              {developerFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href="/dashboard/api-keys" className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-cyan-300/30">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-950 dark:text-white">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <CodeTabs />
        </div>
      </section>

      <section id="endpoint" className="mx-auto max-w-[1200px] px-6 py-20">
        <SectionHeader title="接口地址与鉴权" desc="所有请求使用 Bearer Token 鉴权。请不要在公开页面、客户端包或截图中泄露完整密钥。" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['Base URL', brand.baseUrl],
            ['Models', `${brand.baseUrl}/models`],
            ['Chat Completions', `${brand.baseUrl}/chat/completions`],
          ].map(([label, value]) => (
            <button key={label} onClick={() => copy(value)} className="tech-surface rounded-2xl border border-white/10 p-5 text-left">
              <div className="text-sm font-black text-cyan-300">{label}</div>
              <code className="mt-3 block truncate text-sm text-slate-700 dark:text-slate-200">{value}</code>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500"><Copy className="h-3.5 w-3.5" />点击复制</div>
            </button>
          ))}
        </div>
      </section>

      <section id="clients" className="w-full border-y border-white/10 bg-white/[0.035] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title="一键导入客户端" desc="在控制台创建令牌后，点击“导入”即可生成对应客户端配置。部分客户端会自动打开导入链接，部分会复制或下载配置。" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <Link key={client} href="/dashboard/api-keys" className="tech-surface rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Download className="h-5 w-5" /></span>
                  <div className="font-black text-slate-950 dark:text-white">{client}</div>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">从令牌管理页导入配置</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-[1200px] px-6 py-20">
        <SectionHeader title="开发工具配置" desc="以下配置可直接复制到常用开发工具或环境变量中。" />
        <div className="grid gap-5 lg:grid-cols-3">
          {toolConfigs.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="tech-surface rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon className="h-5 w-5" /></span>
                  <h3 className="font-black text-slate-950 dark:text-white">{item.title}</h3>
                </div>
                <pre className="mt-4 min-h-[140px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-cyan-50"><code>{item.code}</code></pre>
                <button onClick={() => copy(item.code)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-black text-slate-950">
                  <Copy className="h-4 w-4" />复制配置
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[980px] px-6 py-20">
        <SectionHeader title="常见问题" />
        <div className="grid gap-4">
          {faqs.map(([question, answer]) => (
            <div key={question} className="tech-surface rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 font-black text-slate-950 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                {question}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard/api-keys" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950">
            创建令牌并开始接入 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
