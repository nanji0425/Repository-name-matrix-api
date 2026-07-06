'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Paintbrush, Play } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '绘图日志',
    desc: '这里显示近期图片生成相关调用，方便回查素材与费用。',
    playground: '去 Playground',
    recent: '近期记录',
    empty: '暂时没有绘图调用记录。',
    unknownModel: '未知绘图模型',
    cost: '费用',
  },
  en: {
    title: 'Image Logs',
    desc: 'Recent image generation calls are shown here for asset and cost review.',
    playground: 'Go to Playground',
    recent: 'Recent Records',
    empty: 'No image generation records yet.',
    unknownModel: 'Unknown image model',
    cost: 'Cost',
  },
} as const;

export default function DrawingLogsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    requestLogsApi.list({ limit: 10 }).then((response) => {
      const items = response.data?.items || response.data?.logs || response.data?.data || [];
      setLogs(Array.isArray(items) ? items : []);
    }).catch(() => setLogs([]));
  }, []);

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <Link href="/dashboard/playground" className="console-button-white inline-flex items-center gap-2">
          <Play className="h-4 w-4" />
          {text.playground}
        </Link>
      </div>

      <section className="console-card mt-7 p-7">
        <div className="flex items-center gap-3 text-slate-950 dark:text-white">
          <Paintbrush className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <h2 className="text-lg font-black">{text.recent}</h2>
        </div>
        {logs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
            {text.empty}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-slate-950 dark:text-white">{log.model?.name || log.model?.modelCode || text.unknownModel}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</div>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <ImageIcon className="mr-2 inline h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                    {text.cost} ¥{Number(log.cost || 0).toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePage>
  );
}
