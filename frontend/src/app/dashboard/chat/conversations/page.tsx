'use client';

import Link from 'next/link';
import { MessageCircle, Play, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';

const prompts = [
  '帮我写一份接口文档',
  '把这段代码重构一下',
  '总结这份需求文档',
  '生成一个简单的产品介绍',
];

export default function ChatConversationsPage() {
  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">会话列表</h1>
          <p className="mt-2 text-sm text-slate-400">这里会展示你最近的对话入口和快捷提示。</p>
        </div>
        <Link href="/dashboard/playground" className="console-button-white inline-flex items-center gap-2">
          <Play className="h-4 w-4" />
          立即开始对话
        </Link>
      </div>

      <section className="console-card mt-7 p-7">
        <div className="flex items-center gap-3 text-white">
          <MessageCircle className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-black">最近会话</h2>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-slate-400">
          暂时还没有保存的会话。你可以先去 Playground 试用模型对话。
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => navigator.clipboard.writeText(prompt)}
            className="console-card p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30"
          >
            <div className="flex items-center gap-3 text-white">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <div className="font-bold">快捷提示</div>
            </div>
            <div className="mt-3 text-sm text-slate-300">{prompt}</div>
            <div className="mt-2 text-xs text-slate-500">点击后会复制到剪贴板，方便直接粘贴到对话框。</div>
          </button>
        ))}
      </section>
    </ConsolePage>
  );
}
