'use client';

import { useEffect, useState } from 'react';
import api, { adminApi } from '@/lib/api';
import { shortenApiKey, formatDate } from '@/lib/utils';
import { Key, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await adminApi.listAllApiKeys({ page: p, limit });
      setKeys(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const toggle = async (id: string) => {
    try {
      await api.patch(`/api-keys/${id}/toggle`);
      toast.success('Key status updated');
      load(page);
    } catch {
      toast.error('Failed to update key status');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('API key deleted');
      load(page);
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All API Keys</h1>
        <div className="text-sm text-gray-500">{keys.length} keys total</div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No API keys found across all users.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secret</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keys.map((key: any) => (
                  <tr key={key.id || key._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{key.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {key.userId
                        ? typeof key.userId === 'object'
                          ? key.userId.username || key.userId.email || key.userId.id
                          : String(key.userId).substring(0, 8) + '...'
                        : key.user
                        ? typeof key.user === 'object'
                          ? key.user.username || key.user.email || key.user.id
                          : String(key.user).substring(0, 8) + '...'
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {shortenApiKey(key.secret || key.key || '')}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        key.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {key.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {key.createdAt ? formatDate(key.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggle(key.id || key._id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={key.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        >
                          {key.status === 'ACTIVE'
                            ? <EyeOff className="w-4 h-4 text-gray-400" />
                            : <Eye className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                        <button
                          onClick={() => remove(key.id || key._id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary px-3 py-1.5 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary px-3 py-1.5 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
