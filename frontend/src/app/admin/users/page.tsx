'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const limit = 20;

const copy = {
  zh: {
    title: '用户管理',
    totalPrefix: '共',
    totalSuffix: '个用户',
    searchLabel: '按用户名或邮箱搜索',
    searchPlaceholder: '搜索用户...',
    search: '搜索',
    clear: '清空',
    loading: '正在加载...',
    empty: '暂无用户',
    loadFailed: '用户列表加载失败',
    statusUpdated: '用户状态已更新',
    statusFailed: '用户状态更新失败',
    enable: '启用',
    disable: '停用',
    enableUser: '启用用户',
    disableUser: '停用用户',
    pagePrefix: '第',
    pageMiddle: '/',
    pageSuffix: '页，共',
    records: '条',
    prev: '上一页',
    next: '下一页',
    table: ['ID', '用户名', '角色', '状态', '余额', '注册时间', '操作'],
    status: {
      ACTIVE: '正常',
      DISABLED: '已停用',
      BANNED: '已封禁',
      INACTIVE: '未激活',
    },
    role: {
      ADMIN: '管理员',
      VIP: 'VIP 用户',
      USER: '普通用户',
    },
  },
  en: {
    title: 'User Management',
    totalPrefix: 'Total',
    totalSuffix: 'users',
    searchLabel: 'Search by username or email',
    searchPlaceholder: 'Search users...',
    search: 'Search',
    clear: 'Clear',
    loading: 'Loading...',
    empty: 'No users',
    loadFailed: 'Failed to load users',
    statusUpdated: 'User status updated',
    statusFailed: 'Failed to update user status',
    enable: 'Enable',
    disable: 'Disable',
    enableUser: 'Enable user',
    disableUser: 'Disable user',
    pagePrefix: 'Page',
    pageMiddle: '/',
    pageSuffix: 'of',
    records: 'records',
    prev: 'Previous',
    next: 'Next',
    table: ['ID', 'Username', 'Role', 'Status', 'Balance', 'Registered', 'Actions'],
    status: {
      ACTIVE: 'Active',
      DISABLED: 'Disabled',
      BANNED: 'Banned',
      INACTIVE: 'Inactive',
    },
    role: {
      ADMIN: 'Admin',
      VIP: 'VIP User',
      USER: 'User',
    },
  },
} as const;

export default function AdminUsersPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const doSearch = () => {
    setPage(1);
    setSearch(searchInput);
    load(1, searchInput);
  };

  const toggleStatus = async (id: string) => {
    try {
      await adminApi.toggleUserStatus(id);
      toast.success(text.statusUpdated);
      load(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.statusFailed);
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

  const statusLabel = (status: string) => text.status[status as keyof typeof text.status] || status;
  const roleLabel = (role: string) => text.role[role as keyof typeof text.role] || role;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <div className="text-sm text-gray-500">{text.totalPrefix} {total} {text.totalSuffix}</div>
      </div>

      <div className="card mb-6 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.searchLabel}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && doSearch()} className="w-full rounded-lg border py-2 pl-10 pr-3 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.searchPlaceholder} />
            </div>
          </div>
          <button onClick={doSearch} className="btn-primary">{text.search}</button>
          {search && (
            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); load(1, ''); }} className="btn-secondary">
              {text.clear}
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-12 text-center text-gray-400">{text.loading}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">{text.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 4 ? 'text-right' : index === 6 ? 'text-center' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {users.map((user: any) => {
                  const userId = user.id || user._id;
                  const status = user.status || 'ACTIVE';
                  return (
                    <tr key={userId} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{String(userId).substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-950 dark:text-white">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{formatCurrency(user.balance ?? 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStatus(userId)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                            status === 'DISABLED'
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={status === 'DISABLED' ? text.enableUser : text.disableUser}
                        >
                          {status === 'DISABLED'
                            ? <><ToggleRight className="h-3.5 w-3.5" /> {text.enable}</>
                            : <><ToggleLeft className="h-3.5 w-3.5" /> {text.disable}</>
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
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
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
    </div>
  );
}
