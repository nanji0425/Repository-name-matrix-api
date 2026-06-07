'use client';

import { useEffect, useState } from 'react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { modelsApi, requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [modelId, setModelId] = useState('');
  const [type, setType] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    const response = await requestLogsApi.list({ page, limit: 20, modelId: modelId || undefined, status: type || undefined });
    const data = response.data || {};
    const items = data.items || data.logs || data.data || [];
    setLogs(Array.isArray(items) ? items : []);
    setTotal(data.total || items.length || 0);
  };

  useEffect(() => { modelsApi.listActive().then((r) => setModels(r.data || [])).catch(() => setModels([])); }, []);
  useEffect(() => { load().catch(() => { setLogs([]); setTotal(0); }); }, [page]);

  return (
    <ConsolePage className="pb-24">
      <h1 className="text-3xl font-black text-white">消费日志</h1>
      <div className="mt-7 flex items-center gap-2">
        <select value={modelId} onChange={(event) => setModelId(event.target.value)} className="console-input w-[210px]">
          <option value="">模型筛选</option>
          {models.map((model: any) => <option key={model.id} value={model.id}>{model.name || model.modelCode}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="console-input w-[110px]">
          <option value="">全部类型</option>
          <option value="200">成功</option>
          <option value="500">失败</option>
        </select>
        <button onClick={() => { setPage(1); load(); }} className="h-[38px] rounded-lg bg-white px-4 text-sm font-bold text-slate-950">筛选</button>
      </div>

      <section className="console-card mt-5 overflow-hidden p-7">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-4 py-4 font-bold">时间</th>
              <th className="px-4 py-4 font-bold">类型</th>
              <th className="px-4 py-4 font-bold">模型</th>
              <th className="px-4 py-4 font-bold">输入 TOKEN</th>
              <th className="px-4 py-4 font-bold">输出 TOKEN</th>
              <th className="px-4 py-4 font-bold">费用</th>
              <th className="px-4 py-4 font-bold">API KEY</th>
              <th className="px-4 py-4 font-bold">状态</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/6 text-slate-300">
                <td className="px-4 py-4">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-4">API</td>
                <td className="px-4 py-4">{log.model?.name || log.model?.modelCode || '-'}</td>
                <td className="px-4 py-4">{log.promptTokens || 0}</td>
                <td className="px-4 py-4">{log.completionTokens || 0}</td>
                <td className="px-4 py-4">¥{Number(log.cost || 0).toFixed(4)}</td>
                <td className="px-4 py-4">{log.apiKey?.name || '-'}</td>
                <td className="px-4 py-4">{log.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 条记录</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</button>
          <span>{page} / 1</span>
          <button onClick={() => setPage((value) => value + 1)}>下一页</button>
        </div>
      </div>
    </ConsolePage>
  );
}
