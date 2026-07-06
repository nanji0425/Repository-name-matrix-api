'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const limit = 20;

const statusText: Record<string, string> = {
  COMPLETED: '已完成',
  SUCCESS: '成功',
  PENDING: '待处理',
  FAILED: '失败',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
};

const payTypeText: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT: '微信',
  CREDIT_CARD: '信用卡',
  BALANCE: '余额',
  CRYPTO: '加密货币',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params: any = { page: nextPage, limit };
      if (statusFilter) params.status = statusFilter;
      if (payTypeFilter) params.payType = payTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await ordersApi.listAll(params);
      const items = data.items || data.data || data.orders || [];
      setOrders(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '订单加载失败');
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

  const confirmOrder = async (order: any) => {
    const id = order.id || order._id;
    if (!id || !window.confirm(`确认订单 ${order.orderNo || id} 已到账并给用户加余额？`)) return;

    setUpdatingId(id);
    try {
      await ordersApi.updateStatus(id, 'COMPLETED');
      toast.success('订单已确认并入账');
      await load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '确认订单失败');
    } finally {
      setUpdatingId('');
    }
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

  const getUserName = (order: any) => {
    const user = order.user || order.userId;
    if (!user) return '-';
    if (typeof user === 'object') return user.username || user.email || user.id || '-';
    return String(user).substring(0, 8);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <button onClick={() => load(page)} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">支付方式</label>
            <select value={payTypeFilter} onChange={(event) => setPayTypeFilter(event.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">全部方式</option>
              <option value="ALIPAY">支付宝</option>
              <option value="WECHAT">微信</option>
              <option value="CREDIT_CARD">信用卡</option>
              <option value="BALANCE">余额</option>
              <option value="CRYPTO">加密货币</option>
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
          <button onClick={applyFilter} className="btn-primary">应用筛选</button>
          <button onClick={clearFilter} className="btn-secondary">清空</button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => {
                  const status = order.status || 'PENDING';
                  const payType = order.payType || order.paymentMethod || '';
                  const id = order.id || order._id;
                  return (
                    <tr key={id || order.orderNo} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{order.orderNo || `${String(id || '').substring(0, 8)}...`}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getUserName(order)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">{formatCurrency(parseFloat(order.amount) || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{payTypeText[payType] || payType || '-'}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>{statusText[status] || status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt ? formatDate(order.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {status === 'PENDING' ? (
                          <button
                            onClick={() => confirmOrder(order)}
                            disabled={updatingId === id}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {updatingId === id ? '确认中' : '确认入账'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
      )}
    </div>
  );
}
