'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Users, Search, ChevronLeft, ChevronRight, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (q.trim()) params.search = q.trim();
      const { data } = await adminApi.listUsers(params);
      setUsers(data.data || data.users || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load users');
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
      toast.success('User status updated');
      load(page, search);
    } catch {
      toast.error('Failed to update user status');
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="text-sm text-gray-500">Total: {total} users</div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by username or email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Search users..."
              />
            </div>
          </div>
          <button onClick={doSearch} className="btn-primary">Search</button>
          {search && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); load(1, ''); }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user: any) => (
                  <tr key={user.id || user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {(user.id || user._id).substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatCurrency(user.balance ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.createdAt ? formatDate(user.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(user.id || user._id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          user.status === 'DISABLED'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        title={user.status === 'DISABLED' ? 'Enable user' : 'Disable user'}
                      >
                        {user.status === 'DISABLED' ? (
                          <><ToggleRight className="w-3.5 h-3.5" /> Enable</>
                        ) : (
                          <><ToggleLeft className="w-3.5 h-3.5" /> Disable</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
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
    </div>
  );
}
