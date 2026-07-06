'use client';

import Link from 'next/link';
import { ArrowRight, Code2, Copy, KeyRound, PlugZap, TerminalSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CodeTabs, SectionHeader } from '@/components/marketing/MarketingSections';
import { brand, developerFeatures } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const clients = ['Cherry Studio', 'AionUI', 'DeepChat', 'Lobe Chat', 'OpenCat', 'Chatbox', 'NextChat', 'Cursor', 'Continue', 'Cline', 'Roo Code', 'Claude Code', 'Codex', 'VS Code'];

const copyText = {
  zh: {
    nav: ['快速开始', '接口地址', '客户端导入', '开发工具', '常见问题'],
    title: '开发文档',
    desc: '极简、优雅的接入体验。全系模型兼容 OpenAI 格式，支持一键导入常用 AI 客户端。',
    navTitle: '文档导航',
    quickTitle: '为开发者而生',
    quickDesc: '无需重写业务代码，只要替换 Base URL 和 API Key，就能接入多模型能力。',
    endpointTitle: '接口地址与鉴权',
    endpointDesc: '所有请求使用 Bearer Token 鉴权。请不要在公开页面、客户端包或截图中泄露完整密钥。',
    copy: '点击复制',
    copied: '已复制',
    clientsTitle: '一键导入客户端',
    clientsDesc: '在控制台创建令牌后，点击“导入”即可生成对应客户端配置。部分客户端会自动打开导入链接，部分会复制或下载配置。',
    clientHint: '从令牌管理页导入配置',
    toolsTitle: '开发工具配置',
    toolsDesc: '以下配置可直接复制到常用开发工具或环境变量中。',
    copyConfig: '复制配置',
    faqTitle: '常见问题',
    cta: '创建令牌并开始接入',
    secret: '你的密钥',
    faqs: [
      ['是否兼容 OpenAI SDK？', '兼容。将 SDK 的 baseURL 指向 MatrixAPI，并使用你的 API Key 即可。'],
      ['为什么建议按项目创建不同令牌？', '便于分别限制额度、查看日志、禁用异常项目，也能降低密钥泄露后的影响范围。'],
      ['充值后多久到账？', '支付宝支付成功后由 ZPay 异步回调入账，通常会在数秒内完成。'],
      ['能否导入到桌面客户端？', '可以。控制台令牌页面提供 Cherry Studio、AionUI、DeepChat、Lobe Chat、OpenCat、Cursor、Continue、Cline、Roo Code 等配置。'],
    ],
  },
  en: {
    nav: ['Quick Start', 'Endpoints', 'Client Import', 'Developer Tools', 'FAQ'],
    title: 'Developer Docs',
    desc: 'A simple integration experience. All model families are OpenAI-compatible and support one-click import for common AI clients.',
    navTitle: 'Docs Navigation',
    quickTitle: 'Built For Developers',
    quickDesc: 'Replace only the Base URL and API Key to connect multi-model capabilities without rewriting business code.',
    endpointTitle: 'Endpoints And Auth',
    endpointDesc: 'All requests use Bearer Token authentication. Never expose full keys in public pages, client bundles, or screenshots.',
    copy: 'Click to copy',
    copied: 'Copied',
    clientsTitle: 'One-click Client Import',
    clientsDesc: 'After creating a token in the console, use Import to generate client-specific configuration. Some clients open import links; others copy or download config.',
    clientHint: 'Import from token management',
    toolsTitle: 'Developer Tool Config',
    toolsDesc: 'Copy the following snippets into common developer tools or environment variables.',
    copyConfig: 'Copy config',
    faqTitle: 'FAQ',
    cta: 'Create token and start',
    secret: 'your-key',
    faqs: [
      ['Is it compatible with OpenAI SDKs?', 'Yes. Point the SDK baseURL to MatrixAPI and use your API Key.'],
      ['Why create different tokens per project?', 'It helps isolate quotas, logs, abnormal projects, and the blast radius of leaked keys.'],
      ['How fast does recharge arrive?', 'After Alipay payment succeeds, ZPay posts an async callback and balance is usually updated within seconds.'],
      ['Can I import into desktop clients?', 'Yes. The token page supports Cherry Studio, AionUI, DeepChat, Lobe Chat, OpenCat, Cursor, Continue, Cline, Roo Code, and more.'],
    ],
  },
} as const;

async function copy(value: string, message: string) {
  await navigator.clipboard.writeText(value);
  toast.success(message);
}

export default function DocsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copyText[locale];
  const quickNav = [
    { title: text.nav[0], href: '#quickstart' },
    { title: text.nav[1], href: '#endpoint' },
    { title: text.nav[2], href: '#clients' },
    { title: text.nav[3], href: '#tools' },
    { title: text.nav[4], href: '#faq' },
  ];
  const toolConfigs = [
    {
      title: 'Codex / OpenAI SDK',
      icon: TerminalSquare,
      code: `OPENAI_BASE_URL=${brand.baseUrl}\nOPENAI_API_KEY=sk-${text.secret}`,
    },
    {
      title: 'Claude Code',
      icon: Code2,
      code: `ANTHROPIC_BASE_URL=${brand.baseUrl}\nANTHROPIC_AUTH_TOKEN=sk-${text.secret}`,
    },
    {
      title: 'VS Code / Cline / Roo Code',
      icon: PlugZap,
      code: JSON.stringify({ provider: 'openai-compatible', baseUrl: brand.baseUrl, apiKey: `sk-${text.secret}`, model: 'gpt-4o-mini' }, null, 2),
    },
  ];

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-32">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">{text.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">{text.desc}</p>
          </div>
          <div className="tech-surface rounded-2xl border border-white/10 p-4">
            <div className="text-sm font-black text-slate-950 dark:text-white">{text.navTitle}</div>
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
            <SectionHeader center={false} title={text.quickTitle} desc={text.quickDesc} />
            <div className="grid gap-4">
              {developerFeatures[locale].map((feature) => {
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
        <SectionHeader title={text.endpointTitle} desc={text.endpointDesc} />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['Base URL', brand.baseUrl],
            ['Models', `${brand.baseUrl}/models`],
            ['Chat Completions', `${brand.baseUrl}/chat/completions`],
          ].map(([label, value]) => (
            <button key={label} onClick={() => copy(value, text.copied)} className="tech-surface rounded-2xl border border-white/10 p-5 text-left">
              <div className="text-sm font-black text-cyan-300">{label}</div>
              <code className="mt-3 block truncate text-sm text-slate-700 dark:text-slate-200">{value}</code>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500"><Copy className="h-3.5 w-3.5" />{text.copy}</div>
            </button>
          ))}
        </div>
      </section>

      <section id="clients" className="w-full border-y border-white/10 bg-white/[0.035] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader title={text.clientsTitle} desc={text.clientsDesc} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <Link key={client} href="/dashboard/api-keys" className="tech-surface rounded-2xl border border-white/10 p-5 transition hover:border-cyan-300/30">
                <KeyRound className="h-5 w-5 text-cyan-300" />
                <div className="mt-4 font-black text-slate-950 dark:text-white">{client}</div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{text.clientHint}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-[1200px] px-6 py-20">
        <SectionHeader title={text.toolsTitle} desc={text.toolsDesc} />
        <div className="grid gap-5 lg:grid-cols-3">
          {toolConfigs.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="tech-surface rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-3 font-black text-slate-950 dark:text-white">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  {item.title}
                </div>
                <pre className="mt-4 min-h-32 overflow-auto rounded-xl bg-black/50 p-4 text-xs leading-6 text-cyan-50">{item.code}</pre>
                <button onClick={() => copy(item.code, text.copied)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100">
                  <Copy className="h-4 w-4" />{text.copyConfig}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section id="faq" className="w-full border-y border-white/10 bg-white/[0.035] py-20">
        <div className="mx-auto max-w-[900px] px-6">
          <SectionHeader title={text.faqTitle} />
          <div className="grid gap-4">
            {text.faqs.map(([question, answer]) => (
              <div key={question} className="tech-surface rounded-2xl border border-white/10 p-5">
                <div className="font-black text-slate-950 dark:text-white">{question}</div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/api-keys" className="mx-auto mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-cyan-100">
            {text.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
