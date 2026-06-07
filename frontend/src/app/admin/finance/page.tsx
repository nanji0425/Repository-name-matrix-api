'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusText: Record<string, string> = {
  COMPLETED: '已完成',
  SUCCESS: '成功',
  PENDING: '待处理',
  FAILED: '失败',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
};

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
      toast.error('财务数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = Array.isArray(orders)
    ? orders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0)
    : 0;
  const completedOrders = Array.isArray(orders)
    ? orders.filter((order) => order.status === 'COMPLETED' || order.status === 'SUCCESS').length
    : 0;
  const pendingOrders = Array.isArray(orders)
    ? orders.filter((order) => order.status === 'PENDING').length
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

  const getUserName = (order: any) => {
    const user = order.user || order.userId;
    if (!user) return '-';
    if (typeof user === 'object') return user.username || user.email || user.id || '-';
    return String(user).substring(0, 8);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">财务总览</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="mb-3 inline-flex rounded-lg bg-green-50 p-2">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-500">累计收入</div>
        </div>
        <div className="card p-5">
          <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{Array.isArray(orders) ? orders.length : 0}</div>
          <div className="text-sm text-gray-500">订单总数</div>
        </div>
        <div className="card p-5">
          <div className="mb-3 inline-flex rounded-lg bg-purple-50 p-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-5">
          <div className="mb-3 inline-flex rounded-lg bg-yellow-50 p-2">
            <CreditCard className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold">{pendingOrders}</div>
          <div className="text-sm text-gray-500">待处理</div>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">全部状态</option>
              <option value="COMPLETED">已完成</option>
              <option value="PENDING">待处理</option>
              <option value="FAILED">失败</option>
              <option value="CANCELLED">已取消</option>
              <option value="REFUNDED">已退款</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">开始日期</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">结束日期</label>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={load} className="btn-primary">应用筛选</button>
          <button onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); load(); }} className="btn-secondary">清空</button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : !Array.isArray(orders) || orders.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无订单</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">用户</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">支付方式</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => {
                  const status = order.status || 'PENDING';
                  return (
                    <tr key={order.id || order._id || order.orderNo} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm font-medium">{order.orderNo || order.id?.substring(0, 12) || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getUserName(order)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">{formatCurrency(parseFloat(order.amount) || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.payType || order.paymentMethod || '-'}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>{statusText[status] || status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt ? formatDate(order.createdAt) : '-'}</td>
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
