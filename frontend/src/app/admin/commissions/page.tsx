'use client';

import { useEffect, useState } from 'react';
import { commissionsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const { data } = await commissionsApi.list();
      const items = data.data || data.commissions || data || [];
      let filtered = Array.isArray(items) ? items : [];
      if (status) {
        filtered = filtered.filter((c: any) => c.status === status);
      }
      setCommissions(filtered);
    } catch {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PAID: 'bg-green-50 text-green-700',
      SETTLED: 'bg-green-50 text-green-700',
      PENDING: 'bg-yellow-50 text-yellow-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      FAILED: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-yellow-50 text-yellow-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Commission Management</h1>
        <div className="text-sm text-gray-500">{commissions.length} records</div>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                load(e.target.value);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(''); load(''); }}
              className="btn-secondary"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Commissions Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : commissions.length === 0 ? (
        <div className="card p-12 text-center">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No commission records found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited User</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c: any) => (
                  <tr key={c.id || c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      {c.user
                        ? typeof c.user === 'object'
                          ? c.user.username || c.user.email || c.user.id
                          : c.user
                        : c.userId
                        ? typeof c.userId === 'object'
                          ? c.userId.username || c.userId.email
                          : String(c.userId).substring(0, 8)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.invitedUser
                        ? typeof c.invitedUser === 'object'
                          ? c.invitedUser.username || c.invitedUser.email || c.invitedUser.id
                          : c.invitedUser
                        : c.invitedUserId
                        ? typeof c.invitedUserId === 'object'
                          ? c.invitedUserId.username || c.invitedUserId.email
                          : String(c.invitedUserId).substring(0, 8)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                      {formatCurrency(parseFloat(c.amount) || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-600">
                      {c.rate != null ? `${(parseFloat(c.rate) * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                        {c.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
