'use client';

import { useEffect, useState } from 'react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function TaskLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate] = useState('2026-07-08 00:00');
  const [endDate] = useState('2026-07-08 22:22');

  useEffect(() => {
    setLoading(true);
    requestLogsApi
      .list({ page: 1, limit: 20 })
      .then((response) => {
        const data = response.data || {};
        const items = data.items || data.logs || data.data || [];
        setLogs(Array.isArray(items) ? items : []);
        setTotal(data.total || items.length || 0);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConsolePage className="pb-6">
      <div className="console-card p-0">
        <div className="border-b border-[#f3d9e5] px-6 py-5">
          <div className="text-2xl font-bold text-[#231f27]">任务日志</div>
          <div className="mt-1 text-sm text-[#9b8292]">查看任务提交、处理和结果状态</div>
        </div>

        <div className="px-6 pt-5">
          <div className="grid gap-3 xl:grid-cols-[1fr_320px_auto_auto]">
            <input value={`${startDate} ~ ${endDate}`} readOnly className="console-input w-full" />
            <input placeholder="按任务 ID 筛选" className="console-input w-full" />
            <button className="console-button-white">重置</button>
            <button className="console-button-white bg-gradient-to-r from-[#f472b6] to-[#ec4899] text-white">搜索</button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="bg-[#fff8fb] text-[#9b8292]">
              <tr>
                {['提交时间', '任务 ID', '耗时', '状态', '进度', '详情'].map((item) => <th key={item} className="px-5 py-4 font-medium">{item}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-[#9b8292]">正在加载...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-24 text-center text-[#9b8292]">
                    <div className="text-lg font-semibold text-[#231f27]">未找到日志</div>
                    <div className="mt-2">暂无使用日志。发起 API 调用后日志将显示在此处。</div>
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-t border-[#f6e4ec] text-[#3e3140]">
                  <td className="px-5 py-4">{formatDate(log.createdAt)}</td>
                  <td className="px-5 py-4 font-mono text-xs">{log.id}</td>
                  <td className="px-5 py-4">{log.latency || 0}ms</td>
                  <td className="px-5 py-4">{log.status || '-'}</td>
                  <td className="px-5 py-4">{log.progress || '100%'}</td>
                  <td className="px-5 py-4">{log.model?.name || log.model?.modelCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#f3d9e5] px-6 py-5 text-sm text-[#8f7384]">
          <span>总计：{total} 条记录</span>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-[#f1d6e2] bg-white px-3 py-1.5">上一页</button>
            <span>1 / 1</span>
            <button className="rounded-full border border-[#f1d6e2] bg-white px-3 py-1.5">下一页</button>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
