'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (statusFilter) params.status = statusFilter;
      if (payTypeFilter) params.payType = payTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await ordersApi.listAll(params);
      const items = data.data || data.orders || data || [];
      setOrders(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const applyFilter = () => {
    setPage(1);
    load(1);
  };

  const clearFilter = () => {
    setStatusFilter('');
    setPayTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-50 text-green-700',
      SUCCESS: 'bg-green-50 text-green-700',
      PENDING: 'bg-yellow-50 text-yellow-700',
      FAILED: 'bg-red-50 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      REFUNDED: 'bg-blue-50 text-blue-700',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-500">Total: {total} orders</div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
            <select
              value={payTypeFilter}
              onChange={e => setPayTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="ALIPAY">Alipay</option>
              <option value="WECHAT">WeChat</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BALANCE">Balance</option>
              <option value="CRYPTO">Crypto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button onClick={applyFilter} className="btn-primary">Apply</button>
          <button onClick={clearFilter} className="btn-secondary">Clear</button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <tr key={order.id || order._id || order.orderNo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      {(order.id || order._id || '').substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.user
                        ? typeof order.user === 'object'
                          ? order.user.username || order.user.email || order.user.id
                          : order.user
                        : order.userId
                        ? typeof order.userId === 'object'
                          ? order.userId.username || order.userId.email
                          : String(order.userId).substring(0, 8)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                      {formatCurrency(parseFloat(order.amount) || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.payType || order.paymentMethod || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {order.createdAt ? formatDate(order.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
      )}
    </div>
  );
}
