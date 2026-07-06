'use client';

import { useEffect, useState } from 'react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '任务日志',
    loading: '正在加载...',
    empty: '暂无任务日志。',
    request: 'API 请求',
    total: '共',
    records: '条记录',
    pager: '上一页 1 / 1 下一页',
    table: ['时间', '任务 ID', '模型', '请求内容', '响应状态', '耗时'],
  },
  en: {
    title: 'Task Logs',
    loading: 'Loading...',
    empty: 'No task logs yet.',
    request: 'API Request',
    total: 'Total',
    records: 'records',
    pager: 'Previous 1 / 1 Next',
    table: ['Time', 'Task ID', 'Model', 'Request', 'Status', 'Latency'],
  },
} as const;

export default function TaskLogsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    requestLogsApi.list({ page: 1, limit: 20 }).then((response) => {
      const data = response.data || {};
      const items = data.items || data.logs || data.data || [];
      setLogs(Array.isArray(items) ? items : []);
      setTotal(data.total || items.length || 0);
    }).catch(() => {
      setLogs([]);
      setTotal(0);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <ConsolePage className="pb-24">
      <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
      <section className="console-card mt-7 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="text-slate-600 dark:text-slate-400">
              <tr className="border-b border-cyan-200/20">
                {text.table.map((item) => <th key={item} className="px-4 py-4 font-bold">{item}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-slate-500">{text.loading}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-slate-500">{text.empty}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-cyan-200/10 text-slate-700 dark:text-slate-300">
                  <td className="px-4 py-4">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-4 font-mono">{log.id}</td>
                  <td className="px-4 py-4">{log.model?.name || log.model?.modelCode || '-'}</td>
                  <td className="px-4 py-4">{text.request}</td>
                  <td className="px-4 py-4">{log.status || '-'}</td>
                  <td className="px-4 py-4">{log.latency || 0}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>{text.total} {total} {text.records}</span>
        <span>{text.pager}</span>
      </div>
    </ConsolePage>
  );
}
