'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatDate, shortenApiKey } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Key, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const limit = 20;

const copy = {
  zh: {
    title: 'API Key 审计',
    totalPrefix: '共',
    totalSuffix: '个密钥',
    loading: '正在加载...',
    empty: '暂无任何用户 API Key。',
    loadFailed: 'API Key 列表加载失败',
    statusUpdated: 'API Key 状态已更新',
    statusFailed: 'API Key 状态更新失败',
    deleteConfirm: '确认删除这个 API Key 吗？删除后无法恢复。',
    deleted: 'API Key 已删除',
    deleteFailed: 'API Key 删除失败',
    active: '活跃',
    disabled: '已停用',
    neverUsed: '从未使用',
    disable: '停用',
    enable: '启用',
    delete: '删除',
    pagePrefix: '第',
    pageMiddle: '/',
    pageSuffix: '页，共',
    records: '条',
    prev: '上一页',
    next: '下一页',
    table: ['密钥名称', '用户', 'Secret', '状态', '最后使用', '创建时间', '操作'],
  },
  en: {
    title: 'API Key Audit',
    totalPrefix: 'Total',
    totalSuffix: 'keys',
    loading: 'Loading...',
    empty: 'No user API keys yet.',
    loadFailed: 'Failed to load API keys',
    statusUpdated: 'API Key status updated',
    statusFailed: 'Failed to update API Key status',
    deleteConfirm: 'Delete this API Key? This cannot be undone.',
    deleted: 'API Key deleted',
    deleteFailed: 'Failed to delete API Key',
    active: 'Active',
    disabled: 'Disabled',
    neverUsed: 'Never used',
    disable: 'Disable',
    enable: 'Enable',
    delete: 'Delete',
    pagePrefix: 'Page',
    pageMiddle: '/',
    pageSuffix: 'of',
    records: 'records',
    prev: 'Previous',
    next: 'Next',
    table: ['Key Name', 'User', 'Secret', 'Status', 'Last Used', 'Created', 'Actions'],
  },
} as const;

export default function AdminApiKeysPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const { data } = await adminApi.listAllApiKeys({ page: nextPage, limit });
      setKeys(data.data || data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggle = async (id: string) => {
    try {
      await adminApi.toggleApiKeyStatus(id);
      toast.success(text.statusUpdated);
      load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.statusFailed);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return;
    try {
      await adminApi.deleteApiKey(id);
      toast.success(text.deleted);
      load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.deleteFailed);
    }
  };

  const getOwner = (key: any) => {
    const owner = key.user || key.userId;
    if (!owner) return '-';
    if (typeof owner === 'object') return owner.username || owner.email || owner.id || '-';
    return `${String(owner).substring(0, 8)}...`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <div className="text-sm text-gray-500">{text.totalPrefix} {total || keys.length} {text.totalSuffix}</div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <Key className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 6 ? 'text-center' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {keys.map((key: any) => {
                  const id = key.id || key._id;
                  const active = (key.status || 'ACTIVE') === 'ACTIVE';
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm font-medium text-slate-950 dark:text-white">{key.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-slate-300">{getOwner(key)}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          {shortenApiKey(key.secret || key.key || '')}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? text.active : text.disabled}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.lastUsed ? formatDate(key.lastUsed) : text.neverUsed}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.createdAt ? formatDate(key.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => toggle(id)} className="rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10" title={active ? text.disable : text.enable}>
                            {active ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                          <button onClick={() => remove(id)} className="rounded p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10" title={text.delete}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm text-gray-500">{text.pagePrefix} {page} {text.pageMiddle} {totalPages} {text.pageSuffix} {total} {text.records}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="btn-secondary px-3 py-1.5 disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" /> {text.prev}
            </button>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="btn-secondary px-3 py-1.5 disabled:opacity-50">
              {text.next} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
