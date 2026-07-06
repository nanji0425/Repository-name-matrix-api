'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Paintbrush, Play } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function DrawingLogsPage() {
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
          <h1 className="text-3xl font-black text-white">绘图日志</h1>
          <p className="mt-2 text-sm text-slate-400">这里显示近期图片生成相关调用，方便回查素材与费用。</p>
        </div>
        <Link href="/dashboard/playground" className="console-button-white inline-flex items-center gap-2">
          <Play className="h-4 w-4" />
          去 Playground
        </Link>
      </div>

      <section className="console-card mt-7 p-7">
        <div className="flex items-center gap-3 text-white">
          <Paintbrush className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-black">近期记录</h2>
        </div>
        {logs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-slate-400">
            暂时没有绘图调用记录。
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-white">{log.model?.name || log.model?.modelCode || '未知绘图模型'}</div>
                    <div className="text-sm text-slate-400">{formatDate(log.createdAt)}</div>
                  </div>
                  <div className="text-sm text-slate-300">
                    <ImageIcon className="mr-2 inline h-4 w-4 text-cyan-300" />
                    费用 ￥{Number(log.cost || 0).toFixed(4)}
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
