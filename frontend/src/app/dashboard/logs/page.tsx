'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { modelsApi, requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const pageSize = 20;

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [modelId, setModelId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const load = async (nextPage = page, searchValue = appliedKeyword) => {
    setLoading(true);
    try {
      const response = await requestLogsApi.list({
        page: nextPage,
        limit: pageSize,
        search: searchValue || undefined,
        modelId: modelId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const data = response.data || {};
      const items = data.items || data.logs || data.data || [];
      setLogs(Array.isArray(items) ? items : []);
      setTotal(data.total || items.length || 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    modelsApi.listActive().then((response) => setModels(response.data || [])).catch(() => setModels([]));
  }, []);

  useEffect(() => {
    load(page);
  }, [page]);

  const applyFilter = () => {
    setAppliedKeyword(keyword.trim());
    if (page === 1) {
      load(1, keyword.trim());
    } else {
      setPage(1);
    }
  };

  const resetFilter = () => {
    setKeyword('');
    setAppliedKeyword('');
    setModelId('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    if (page === 1) {
      setTimeout(() => load(1, ''), 0);
    } else {
      setPage(1);
    }
  };

  const exportCurrentPage = () => {
    downloadCsv('matrixapi-request-logs.csv', [
      ['时间', '类型', '模型', '输入 Token', '输出 Token', '费用', 'API Key', '状态'],
      ...logs.map((log) => [
        formatDate(log.createdAt),
        'API',
        log.model?.name || log.model?.modelCode || '-',
        log.promptTokens || 0,
        log.completionTokens || 0,
        Number(log.cost || 0).toFixed(6),
        log.apiKey?.name || '-',
        log.status || '-',
      ]),
    ]);
  };

  return (
    <ConsolePage className="pb-6">
      <div className="console-card p-0">
        <div className="border-b border-[#f3d9e5] px-6 py-5">
          <div className="text-2xl font-bold text-[#231f27]">使用日志</div>
          <div className="mt-1 text-sm text-[#9b8292]">记录每一次 API 调用</div>
        </div>
        <div className="px-6 pt-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_220px_160px_160px_160px_auto_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c39aac]" />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyFilter()} className="console-input w-full pl-10" placeholder="搜索模型或 API Key" />
            </label>
            <select value={modelId} onChange={(event) => setModelId(event.target.value)} className="console-input w-full">
              <option value="">所有模型</option>
              {models.map((model: any) => <option key={model.id} value={model.id}>{model.name || model.modelCode}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="console-input w-full">
              <option value="">所有状态</option>
              <option value="200">成功</option>
              <option value="500">失败</option>
            </select>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="console-input w-full" />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="console-input w-full" />
            <button onClick={applyFilter} className="console-button-white">搜索</button>
            <button onClick={resetFilter} className="console-button-white">重置</button>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={exportCurrentPage} disabled={logs.length === 0} className="console-button-white inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" />
              导出 CSV
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#fff8fb] text-[#9b8292]">
              <tr>
                {['时间', '类型', '模型', '输入 Token', '输出 Token', '费用', 'API Key', '状态'].map((item) => <th key={item} className="px-5 py-4 font-medium">{item}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-[#9b8292]">正在加载...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-[#9b8292]">暂无使用日志</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-t border-[#f6e4ec] text-[#3e3140]">
                  <td className="px-5 py-4">{formatDate(log.createdAt)}</td>
                  <td className="px-5 py-4">API</td>
                  <td className="px-5 py-4 font-semibold text-[#231f27]">{log.model?.name || log.model?.modelCode || '-'}</td>
                  <td className="px-5 py-4">{log.promptTokens || 0}</td>
                  <td className="px-5 py-4">{log.completionTokens || 0}</td>
                  <td className="px-5 py-4 font-semibold text-[#231f27]">${Number(log.cost || 0).toFixed(4)}</td>
                  <td className="px-5 py-4">{log.apiKey?.name || '-'}</td>
                  <td className="px-5 py-4">{log.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#f3d9e5] px-6 py-5 text-sm text-[#8f7384]">
          <span>总计：{total} 条记录</span>
          <div className="flex items-center gap-3">
            <button className="disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</button>
            <span>{page} / {totalPages}</span>
            <button className="disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>下一页</button>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
