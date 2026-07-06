'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const limit = 20;

const statusText: Record<string, string> = {
  ACTIVE: '正常',
  DISABLED: '已停用',
  BANNED: '已封禁',
  INACTIVE: '未激活',
};

const roleText: Record<string, string> = {
  ADMIN: '管理员',
  VIP: 'VIP 用户',
  USER: '普通用户',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = async (nextPage = page, keyword = search) => {
    setLoading(true);
    try {
      const params: any = { page: nextPage, limit };
      if (keyword.trim()) params.search = keyword.trim();
      const { data } = await adminApi.listUsers(params);
      setUsers(data.data || data.users || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '用户列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page, search); }, [page]);

  const doSearch = () => {
    setPage(1);
    setSearch(searchInput);
    load(1, searchInput);
  };

  const toggleStatus = async (id: string) => {
    try {
      await adminApi.toggleUserStatus(id);
      toast.success('用户状态已更新');
      load(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '用户状态更新失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700',
      DISABLED: 'bg-red-50 text-red-700',
      BANNED: 'bg-red-50 text-red-700',
      INACTIVE: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-50 text-purple-700';
    if (role === 'VIP') return 'bg-yellow-50 text-yellow-700';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="text-sm text-gray-500">共 {total} 个用户</div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">按用户名或邮箱搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && doSearch()} className="w-full rounded-lg border py-2 pl-10 pr-3 outline-none focus:ring-2 focus:ring-primary-500" placeholder="搜索用户..." />
            </div>
          </div>
          <button onClick={doSearch} className="btn-primary">搜索</button>
          {search && (
            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); load(1, ''); }} className="btn-secondary">
              清空
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">正在加载...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">暂无用户</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">用户名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">余额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">注册时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user: any) => {
                  const userId = user.id || user._id;
                  const status = user.status || 'ACTIVE';
                  return (
                    <tr key={userId} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{String(userId).substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {roleText[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>
                          {statusText[status] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(user.balance ?? 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStatus(userId)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                            status === 'DISABLED'
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={status === 'DISABLED' ? '启用用户' : '停用用户'}
                        >
                          {status === 'DISABLED'
                            ? <><ToggleRight className="h-3.5 w-3.5" /> 启用</>
                            : <><ToggleLeft className="h-3.5 w-3.5" /> 停用</>
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
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
    </div>
  );
}
