'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatDate, shortenApiKey } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Key, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const limit = 20;

export default function AdminApiKeysPage() {
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
      toast.error(error.response?.data?.message || 'API Key 列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const toggle = async (id: string) => {
    try {
      await adminApi.toggleApiKeyStatus(id);
      toast.success('API Key 状态已更新');
      load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'API Key 状态更新失败');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这个 API Key 吗？删除后无法恢复。')) return;
    try {
      await adminApi.deleteApiKey(id);
      toast.success('API Key 已删除');
      load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'API Key 删除失败');
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
        <h1 className="text-2xl font-bold">API Key 审计</h1>
        <div className="text-sm text-gray-500">共 {total || keys.length} 个密钥</div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center">
          <Key className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无任何用户 API Key。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">密钥名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Secret</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">最后使用</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keys.map((key: any) => {
                  const id = key.id || key._id;
                  const active = (key.status || 'ACTIVE') === 'ACTIVE';
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{key.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">{getOwner(key)}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                          {shortenApiKey(key.secret || key.key || '')}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? '活跃' : '已停用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.lastUsed ? formatDate(key.lastUsed) : '从未使用'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.createdAt ? formatDate(key.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => toggle(id)} className="rounded p-1.5 transition-colors hover:bg-gray-100" title={active ? '停用' : '启用'}>
                            {active ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                          <button onClick={() => remove(id)} className="rounded p-1.5 transition-colors hover:bg-red-50" title="删除">
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
        <div className="mt-4 flex items-center justify-between rounded-lg border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-sm text-gray-500">第 {page} / {totalPages} 页，共 {total} 条</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="btn-secondary px-3 py-1.5 disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" /> 上一页
            </button>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="btn-secondary px-3 py-1.5 disabled:opacity-50">
              下一页 <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
