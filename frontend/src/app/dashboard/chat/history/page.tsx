'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { History, MessageSquareText, Play } from 'lucide-react';

export default function ChatHistoryPage() {
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
          <h1 className="text-3xl font-black text-white">对话历史</h1>
          <p className="mt-2 text-sm text-slate-400">这里展示最近的请求与对话痕迹，方便回看使用情况。</p>
        </div>
        <Link href="/dashboard/playground" className="console-button-white inline-flex items-center gap-2">
          <Play className="h-4 w-4" />
          去 Playground
        </Link>
      </div>

      <section className="console-card mt-7 p-7">
        <div className="flex items-center gap-3 text-white">
          <History className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-black">最近记录</h2>
        </div>
        {logs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-slate-400">
            目前还没有可展示的历史记录。
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-white">{log.model?.name || log.model?.modelCode || '未知模型'}</div>
                    <div className="text-sm text-slate-400">{formatDate(log.createdAt)}</div>
                  </div>
                  <div className="text-sm text-slate-300">
                    <MessageSquareText className="mr-2 inline h-4 w-4 text-cyan-300" />
                    输入 {log.promptTokens || 0} / 输出 {log.completionTokens || 0}
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
