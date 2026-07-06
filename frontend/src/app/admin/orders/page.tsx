'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const limit = 20;

const copy = {
  zh: {
    title: '订单管理',
    refresh: '刷新',
    status: '状态',
    allStatus: '全部状态',
    payType: '支付方式',
    allPayTypes: '全部方式',
    startDate: '开始日期',
    endDate: '结束日期',
    apply: '应用筛选',
    clear: '清空',
    loading: '正在加载...',
    empty: '暂无订单',
    loadFailed: '订单加载失败',
    confirmMessage: '确认订单 {order} 已到账并给用户加余额？',
    confirmed: '订单已确认并入账',
    confirmFailed: '确认订单失败',
    confirming: '确认中',
    confirmCredit: '确认入账',
    pagePrefix: '第',
    pageMiddle: '/',
    pageSuffix: '页，共',
    records: '条',
    prev: '上一页',
    next: '下一页',
    table: ['订单号', '用户', '金额', '支付方式', '状态', '创建时间', '操作'],
    statuses: {
      COMPLETED: '已完成',
      SUCCESS: '成功',
      PENDING: '待处理',
      FAILED: '失败',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    },
    payTypes: {
      ALIPAY: '支付宝',
      WECHAT: '微信',
      CREDIT_CARD: '信用卡',
      BALANCE: '余额',
      CRYPTO: '加密货币',
    },
  },
  en: {
    title: 'Order Management',
    refresh: 'Refresh',
    status: 'Status',
    allStatus: 'All statuses',
    payType: 'Payment Method',
    allPayTypes: 'All methods',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply Filters',
    clear: 'Clear',
    loading: 'Loading...',
    empty: 'No orders',
    loadFailed: 'Failed to load orders',
    confirmMessage: 'Confirm order {order} has been paid and credit the user balance?',
    confirmed: 'Order confirmed and credited',
    confirmFailed: 'Failed to confirm order',
    confirming: 'Confirming',
    confirmCredit: 'Confirm Credit',
    pagePrefix: 'Page',
    pageMiddle: '/',
    pageSuffix: 'of',
    records: 'records',
    prev: 'Previous',
    next: 'Next',
    table: ['Order No.', 'User', 'Amount', 'Payment', 'Status', 'Created', 'Actions'],
    statuses: {
      COMPLETED: 'Completed',
      SUCCESS: 'Success',
      PENDING: 'Pending',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    },
    payTypes: {
      ALIPAY: 'Alipay',
      WECHAT: 'WeChat',
      CREDIT_CARD: 'Credit Card',
      BALANCE: 'Balance',
      CRYPTO: 'Crypto',
    },
  },
} as const;

export default function AdminOrdersPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
    const label = order.orderNo || id;
    if (!id || !window.confirm(text.confirmMessage.replace('{order}', label))) return;

    setUpdatingId(id);
    try {
      await ordersApi.updateStatus(id, 'COMPLETED');
      toast.success(text.confirmed);
      await load(page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.confirmFailed);
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

  const statusLabel = (status: string) => text.statuses[status as keyof typeof text.statuses] || status;
  const payTypeLabel = (payType: string) => text.payTypes[payType as keyof typeof text.payTypes] || payType || '-';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <button onClick={() => load(page)} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {text.refresh}
        </button>
      </div>

      <div className="card mb-6 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.status}</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white">
              <option value="">{text.allStatus}</option>
              {Object.entries(text.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.payType}</label>
            <select value={payTypeFilter} onChange={(event) => setPayTypeFilter(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white">
              <option value="">{text.allPayTypes}</option>
              {Object.entries(text.payTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.startDate}</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.endDate}</label>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </div>
          <button onClick={applyFilter} className="btn-primary">{text.apply}</button>
          <button onClick={clearFilter} className="btn-secondary">{text.clear}</button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 2 || index === 6 ? 'text-right' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {orders.map((order: any) => {
                  const status = order.status || 'PENDING';
                  const payType = order.payType || order.paymentMethod || '';
                  const id = order.id || order._id;
                  return (
                    <tr key={id || order.orderNo} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{order.orderNo || `${String(id || '').substring(0, 8)}...`}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{getUserName(order)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-slate-950 dark:text-white">{formatCurrency(parseFloat(order.amount) || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{payTypeLabel(payType)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>{statusLabel(status)}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt ? formatDate(order.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {status === 'PENDING' ? (
                          <button
                            onClick={() => confirmOrder(order)}
                            disabled={updatingId === id}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {updatingId === id ? text.confirming : text.confirmCredit}
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
      )}
    </div>
  );
}
