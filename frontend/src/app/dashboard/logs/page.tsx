'use client';

import { useEffect, useState } from 'react';
import { requestLogsApi, modelsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [modelId, setModelId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    const params: any = { page, limit };
    if (search) params.search = search;
    if (modelId) params.modelId = modelId;
    if (status) params.status = status;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    requestLogsApi
      .list(params)
      .then((r) => {
        const data = r.data;
        setLogs(data?.logs || data?.data || data || []);
        setTotal(data?.total ?? data?.count ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  useEffect(() => {
    modelsApi.listActive().then((r) => setModels(r.data || [])).catch(() => {});
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Request Logs</h1>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Text Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Model, IP, user..."
              />
            </div>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Models</option>
              {models.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="200">200 (Success)</option>
              <option value="400">4xx (Client Error)</option>
              <option value="500">5xx (Server Error)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button onClick={handleSearch} className="btn-primary px-3">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No request logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Model</th>
                    <th className="px-6 py-3 font-medium">Prompt Tokens</th>
                    <th className="px-6 py-3 font-medium">Completion Tokens</th>
                    <th className="px-6 py-3 font-medium">Cost</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {log.model?.modelCode || log.modelCode || 'unknown'}
                      </td>
                      <td className="px-6 py-3">{log.promptTokens?.toLocaleString() || '—'}</td>
                      <td className="px-6 py-3">{log.completionTokens?.toLocaleString() || '—'}</td>
                      <td className="px-6 py-3">{log.cost != null ? formatCurrency(log.cost) : '—'}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 200
                              ? 'bg-green-50 text-green-700'
                              : String(log.status).startsWith('4') || String(log.status).startsWith('5')
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">{log.latency != null ? `${log.latency}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary flex items-center gap-1 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
