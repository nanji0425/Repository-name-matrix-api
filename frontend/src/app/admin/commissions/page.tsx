'use client';

import { useEffect, useState } from 'react';
import { commissionsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const statusText: Record<string, string> = {
  PAID: '已支付',
  SETTLED: '已结算',
  PENDING: '待结算',
  CANCELLED: '已取消',
  FAILED: '失败',
};

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
      if (status) filtered = filtered.filter((commission: any) => commission.status === status);
      setCommissions(filtered);
    } catch {
      toast.error('佣金记录加载失败');
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

  const getUserName = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'object') return value.username || value.email || value.id || '-';
    return String(value).substring(0, 8);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">佣金管理</h1>
        <div className="text-sm text-gray-500">共 {commissions.length} 条记录</div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">按状态筛选</label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                load(event.target.value);
              }}
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待结算</option>
              <option value="PAID">已支付</option>
              <option value="SETTLED">已结算</option>
              <option value="CANCELLED">已取消</option>
              <option value="FAILED">失败</option>
            </select>
          </div>
          {statusFilter && (
            <button onClick={() => { setStatusFilter(''); load(''); }} className="btn-secondary">
              清空筛选
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : commissions.length === 0 ? (
        <div className="card p-12 text-center">
          <Gift className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无佣金记录</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">被邀请用户</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">金额</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">比例</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((commission: any) => {
                  const status = commission.status || 'PENDING';
                  return (
                    <tr key={commission.id || commission._id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{getUserName(commission.user || commission.userId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getUserName(commission.invitedUser || commission.invitedUserId)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">{formatCurrency(parseFloat(commission.amount) || 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-600">
                        {commission.rate != null ? `${(parseFloat(commission.rate) * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>
                          {statusText[status] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{commission.createdAt ? formatDate(commission.createdAt) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
