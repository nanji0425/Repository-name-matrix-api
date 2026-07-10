'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, CircleDot, Copy, ExternalLink, Flame, Gauge, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn, copyToClipboard } from '@/lib/utils';

type Stats = {
  totalRequests?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalCost?: number;
};

const announcements = [
  { time: '2026-07-08 09:31:58', title: 'gpt5.6 官方推送已适配，正在逐步放量。', tone: 'green' },
  { time: '2026-07-07 12:31:27', title: '全渠道模型已更新完毕，API 调用保持稳定。', tone: 'blue' },
  { time: '2026-07-07 11:20:10', title: '钱包充值与订单回调已完成校验。', tone: 'pink' },
];

const apiEntries = [
  {
    badge: 'AP',
    title: 'API 入口',
    url: 'https://matrixapi.online/v1',
    desc: 'OpenAI 兼容接口，支持 GPT、Claude、Gemini 等主流模型。',
    actions: ['复制', '打开文档'],
  },
  {
    badge: '备',
    title: '备用入口',
    url: 'https://www.matrixapi.online/v1',
    desc: '备用域名，与主入口完全相同的功能和模型支持。',
    actions: ['复制', '打开'],
  },
  {
    badge: '联',
    title: '联系支持',
    url: 'mailto:3315419516@qq.com',
    desc: '技术支持邮箱：3315419516@qq.com，问题反馈请发送邮件。',
    actions: ['复制', '发送邮件'],
  },
  {
    badge: '文',
    title: 'API 文档',
    url: 'https://matrixapi.online/docs',
    desc: '完整的 API 接入文档和使用示例。',
    actions: ['打开'],
  },
];

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    requestLogsApi.getStats().then((response) => setStats(response.data || {})).catch(() => setStats({}));
  }, []);

  const totalTokens = Number(stats.totalPromptTokens || 0) + Number(stats.totalCompletionTokens || 0);

  const summaryCards = useMemo(
    () => [
      {
        title: '近 24 小时消耗',
        value: `$${Number(stats.totalCost || 0).toFixed(2)}`,
        hint: '近 24 小时消耗量',
        accent: 'from-[#ffedd5] to-[#fef3c7]',
        icon: Flame,
      },
      {
        title: '历史使用情况',
        value: `$${Number(stats.totalCost || 0).toFixed(2)}`,
        hint: '总消耗（USD）',
        accent: 'from-[#fce7f3] to-[#fbcfe8]',
        icon: Gauge,
      },
      {
        title: '请求计数',
        value: String(stats.totalRequests || 0),
        hint: '总请求数',
        accent: 'from-[#ede9fe] to-[#ddd6fe]',
        icon: Sparkles,
      },
    ],
    [stats],
  );

  return (
    <ConsolePage className="pb-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="console-card p-0">
          <div className="border-b border-[#f3d9e5] px-6 py-5">
            <div className="text-2xl font-bold text-[#231f27]">👋 Hello, {user?.username || 'aming'}</div>
            <div className="mt-1 text-sm text-[#9b8292]">用量概览</div>
          </div>
          <div className="grid gap-4 p-6 xl:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[24px] border border-[#f1d6e2] bg-white/80 p-5 shadow-[0_10px_26px_rgba(184,124,154,0.06)]">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${card.accent} text-[#9b4581]`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-4 text-lg font-bold text-[#231f27]">{card.value}</div>
                  <div className="mt-1 text-sm text-[#8f7384]">{card.hint}</div>
                </div>
              );
            })}
          </div>
          <div className="px-6 pb-6">
            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-[26px] border border-[#f3d9e5] bg-white/80 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <CircleDot className="h-4 w-4" />
                  <div className="font-bold">公告</div>
                </div>
                <div className="mt-3 space-y-4">
                  {announcements.map((item) => (
                    <div key={item.time} className="rounded-[20px] border border-[#f6e7ee] bg-[#fff9fc] p-4">
                      <div className="flex items-start gap-3">
                        <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', item.tone === 'green' ? 'bg-emerald-400' : item.tone === 'blue' ? 'bg-sky-400' : 'bg-pink-400')} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#231f27]">{item.title}</div>
                          <div className="mt-1 text-xs text-[#b18c9e]">{item.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f3d9e5] bg-white/80 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <Bell className="h-4 w-4" />
                  <div className="font-bold">API 信息</div>
                </div>
                <div className="mt-4 space-y-3">
                  {apiEntries.map((entry) => (
                    <div key={entry.title} className="rounded-[22px] border border-[#f6e4ec] bg-[#fffafc] p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4f83ff] text-sm font-black text-white">{entry.badge}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-[#231f27]">{entry.title}</div>
                          <div className="truncate text-xs text-[#e2508c]">{entry.url}</div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#8f7384]">{entry.desc}</p>
                      <div className="mt-3 flex gap-2">
                        {entry.actions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              if (action === '打开' || action === '打开文档' || action === '发送邮件') {
                                window.open(entry.url, '_blank', 'noopener,noreferrer');
                              } else {
                                copyToClipboard(entry.url);
                              }
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-[#f0cddb] bg-white px-3 text-xs font-medium text-[#6b5363] hover:bg-[#fff3f8]"
                          >
                            {action.includes('打开') || action.includes('邮件') ? <ExternalLink className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="console-card p-5">
            <div className="flex items-center justify-between text-sm text-[#8f7384]">
              <span>剩余额度</span>
              <span className="inline-flex items-center gap-1 text-[#d36b9a]"><Sparkles className="h-3.5 w-3.5" /> 余额偏低</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-[#231f27]">${Number(user?.balance || 0).toFixed(2)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">近 24 小时消耗</div>
                <div className="mt-1 text-sm font-bold text-[#231f27]">${Number(stats.totalCost || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">可用时长</div>
                <div className="mt-1 text-sm font-bold text-[#f97316]">剩余不足 1 天</div>
              </div>
            </div>
            <Link href="/dashboard/balance" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899] text-sm font-bold text-white">
              钱包充值
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="console-card p-5">
            <div className="text-sm font-bold text-[#231f27]">总 Token</div>
            <div className="mt-2 text-3xl font-black text-[#231f27]">{totalTokens.toLocaleString()}</div>
            <div className="mt-1 text-sm text-[#8f7384]">累计统计</div>
            <div className="mt-4 h-2 rounded-full bg-[#f6e2eb]">
              <div className="h-2 w-[68%] rounded-full bg-gradient-to-r from-[#fb7185] to-[#ec4899]" />
            </div>
          </div>
        </aside>
      </div>
    </ConsolePage>
  );
}
