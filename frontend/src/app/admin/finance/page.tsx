'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFinancePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await ordersApi.listAll(params);
      setOrders(data.data || data.orders || data || []);
    } catch {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyFilter = () => load();

  const totalRevenue = Array.isArray(orders)
    ? orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)
    : 0;
  const completedOrders = Array.isArray(orders)
    ? orders.filter(o => o.status === 'COMPLETED' || o.status === 'SUCCESS').length
    : 0;
  const pendingOrders = Array.isArray(orders)
    ? orders.filter(o => o.status === 'PENDING').length
    : 0;

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
      <h1 className="text-2xl font-bold mb-6">Financial Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="p-2 rounded-lg bg-green-50 inline-flex mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>
        <div className="card p-5">
          <div className="p-2 rounded-lg bg-blue-50 inline-flex mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{Array.isArray(orders) ? orders.length : 0}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div className="card p-5">
          <div className="p-2 rounded-lg bg-purple-50 inline-flex mb-3">
            <CheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="card p-5">
          <div className="p-2 rounded-lg bg-yellow-50 inline-flex mb-3">
            <CreditCard className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold">{pendingOrders}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
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
          <button
            onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); load(); }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : !Array.isArray(orders) || orders.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <tr key={order.id || order._id || order.orderNo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">
                      {order.orderNo || order.id?.substring(0, 12) || '—'}
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
        </div>
      )}
    </div>
  );
}
