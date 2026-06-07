'use client';

import { useEffect, useState } from 'react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function TaskLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    requestLogsApi.list({ page: 1, limit: 20 }).then((response) => {
      const data = response.data || {};
      const items = data.items || data.logs || data.data || [];
      setLogs(Array.isArray(items) ? items : []);
      setTotal(data.total || items.length || 0);
    }).catch(() => { setLogs([]); setTotal(0); });
  }, []);

  return (
    <ConsolePage className="pb-24">
      <h1 className="text-3xl font-black text-white">任务日志</h1>
      <section className="console-card mt-7 overflow-hidden p-7">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-4 py-4 font-bold">时间</th>
              <th className="px-4 py-4 font-bold">任务 ID</th>
              <th className="px-4 py-4 font-bold">模型</th>
              <th className="px-4 py-4 font-bold">请求内容</th>
              <th className="px-4 py-4 font-bold">响应状态</th>
              <th className="px-4 py-4 font-bold">耗时</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/6 text-slate-300">
                <td className="px-4 py-4">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-4 font-mono">{log.id}</td>
                <td className="px-4 py-4">{log.model?.name || log.model?.modelCode || '-'}</td>
                <td className="px-4 py-4">API 请求</td>
                <td className="px-4 py-4">{log.status || '-'}</td>
                <td className="px-4 py-4">{log.latency || 0}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 条记录</span>
        <span>上一页 1 / 1 下一页</span>
      </div>
    </ConsolePage>
  );
}
