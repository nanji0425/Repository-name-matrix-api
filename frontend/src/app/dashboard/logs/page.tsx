'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { modelsApi, requestLogsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useLocaleStore } from '@/stores/localeStore';

const pageSize = 20;

const copy = {
  zh: {
    title: '消费日志',
    search: '搜索模型或 API Key',
    modelFilter: '模型筛选',
    allModels: '全部模型',
    allStatus: '全部状态',
    success: '成功',
    failed: '失败',
    startDate: '开始日期',
    endDate: '结束日期',
    filter: '筛选',
    reset: '重置',
    exportCsv: '导出 CSV',
    loading: '正在加载...',
    empty: '暂无消费日志。',
    total: '共',
    records: '条记录',
    prev: '上一页',
    next: '下一页',
    apiType: 'API',
    exported: '日志已导出',
    table: ['时间', '类型', '模型', '输入 Token', '输出 Token', '费用', 'API Key', '状态'],
  },
  en: {
    title: 'Usage Logs',
    search: 'Search model or API key',
    modelFilter: 'Model Filter',
    allModels: 'All models',
    allStatus: 'All status',
    success: 'Success',
    failed: 'Failed',
    startDate: 'Start Date',
    endDate: 'End Date',
    filter: 'Filter',
    reset: 'Reset',
    exportCsv: 'Export CSV',
    loading: 'Loading...',
    empty: 'No usage logs yet.',
    total: 'Total',
    records: 'records',
    prev: 'Previous',
    next: 'Next',
    apiType: 'API',
    exported: 'Logs exported',
    table: ['Time', 'Type', 'Model', 'Input Token', 'Output Token', 'Cost', 'API Key', 'Status'],
  },
} as const;

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
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      [...text.table],
      ...logs.map((log) => [
        formatDate(log.createdAt),
        text.apiType,
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
    <ConsolePage className="pb-24">
      <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
      <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_210px_130px_150px_150px_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyFilter()} className="console-input h-[38px] w-full pl-9" placeholder={text.search} />
        </label>
        <select value={modelId} onChange={(event) => setModelId(event.target.value)} className="console-input h-[38px] w-full">
          <option value="">{text.allModels}</option>
          {models.map((model: any) => <option key={model.id} value={model.id}>{model.name || model.modelCode}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="console-input h-[38px] w-full">
          <option value="">{text.allStatus}</option>
          <option value="200">{text.success}</option>
          <option value="500">{text.failed}</option>
        </select>
        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="console-input h-[38px] w-full" aria-label={text.startDate} />
        <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="console-input h-[38px] w-full" aria-label={text.endDate} />
        <button onClick={applyFilter} className="console-button-white inline-flex h-[38px] items-center justify-center px-4 text-sm">{text.filter}</button>
        <button onClick={resetFilter} className="console-button-white inline-flex h-[38px] items-center justify-center px-4 text-sm">{text.reset}</button>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={exportCurrentPage} disabled={logs.length === 0} className="console-button-white inline-flex h-[38px] items-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50">
          <Download className="h-4 w-4" />
          {text.exportCsv}
        </button>
      </div>

      <section className="console-card mt-5 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="text-slate-600 dark:text-slate-400">
              <tr className="border-b border-cyan-200/20">
                {text.table.map((item) => <th key={item} className="px-4 py-4 font-bold">{item}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-slate-500">{text.loading}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-slate-500">{text.empty}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-cyan-200/10 text-slate-700 dark:text-slate-300">
                  <td className="px-4 py-4">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-4">{text.apiType}</td>
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
        </div>
      </section>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>{text.total} {total} {text.records}</span>
        <div className="flex items-center gap-3">
          <button className="disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{text.prev}</button>
          <span>{page} / {totalPages}</span>
          <button className="disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{text.next}</button>
        </div>
      </div>
    </ConsolePage>
  );
}
