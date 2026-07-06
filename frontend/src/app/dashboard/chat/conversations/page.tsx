'use client';

import Link from 'next/link';
import { MessageCircle, Play, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '会话列表',
    desc: '这里会展示你最近的对话入口和快捷提示。',
    start: '立即开始对话',
    recent: '最近会话',
    empty: '暂时还没有保存的会话。你可以先去 Playground 试用模型对话。',
    quickPrompt: '快捷提示',
    copyHelp: '点击后会复制到剪贴板，方便直接粘贴到对话框。',
    prompts: ['帮我写一份接口文档', '把这段代码重构一下', '总结这份需求文档', '生成一个简单的产品介绍'],
  },
  en: {
    title: 'Conversations',
    desc: 'Recent conversation entries and quick prompts will appear here.',
    start: 'Start Chatting',
    recent: 'Recent Conversations',
    empty: 'No saved conversations yet. Try the Playground first.',
    quickPrompt: 'Quick Prompt',
    copyHelp: 'Click to copy it to the clipboard for quick pasting.',
    prompts: ['Write an API document for me', 'Refactor this code', 'Summarize this requirements document', 'Generate a simple product intro'],
  },
} as const;

export default function ChatConversationsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <Link href="/dashboard/playground" className="console-button-white inline-flex items-center gap-2">
          <Play className="h-4 w-4" />
          {text.start}
        </Link>
      </div>

      <section className="console-card mt-7 p-7">
        <div className="flex items-center gap-3 text-slate-950 dark:text-white">
          <MessageCircle className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <h2 className="text-lg font-black">{text.recent}</h2>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
          {text.empty}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {text.prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => navigator.clipboard.writeText(prompt)}
            className="console-card p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30"
          >
            <div className="flex items-center gap-3 text-slate-950 dark:text-white">
              <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
              <div className="font-bold">{text.quickPrompt}</div>
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">{prompt}</div>
            <div className="mt-2 text-xs text-slate-500">{text.copyHelp}</div>
          </button>
        ))}
      </section>
    </ConsolePage>
  );
}
