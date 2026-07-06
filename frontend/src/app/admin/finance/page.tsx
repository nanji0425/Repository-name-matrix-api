'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CheckCircle, CreditCard, DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '财务总览',
    refresh: '刷新',
    completedRevenue: '已完成收入',
    currentOrders: '当前列表订单',
    completed: '已完成',
    pending: '待处理',
    status: '状态',
    allStatus: '全部状态',
    startDate: '开始日期',
    endDate: '结束日期',
    apply: '应用筛选',
    clear: '清空',
    loading: '正在加载...',
    empty: '暂无订单',
    loadFailed: '财务数据加载失败',
    table: ['订单号', '用户', '金额', '支付方式', '状态', '时间'],
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
    title: 'Finance Overview',
    refresh: 'Refresh',
    completedRevenue: 'Completed Revenue',
    currentOrders: 'Current Orders',
    completed: 'Completed',
    pending: 'Pending',
    status: 'Status',
    allStatus: 'All statuses',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply Filters',
    clear: 'Clear',
    loading: 'Loading...',
    empty: 'No orders',
    loadFailed: 'Failed to load finance data',
    table: ['Order No.', 'User', 'Amount', 'Payment', 'Status', 'Time'],
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

export default function AdminFinancePage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await ordersApi.listAll(params);
      const items = data.items || data.data || data.orders || [];
      setOrders(Array.isArray(items) ? items : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilter = async () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setLoading(true);
    try {
      const { data } = await ordersApi.listAll({ limit: 100 });
      const items = data.items || data.data || data.orders || [];
      setOrders(Array.isArray(items) ? items : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const paidOrders = Array.isArray(orders) ? orders.filter((order) => order.status === 'COMPLETED' || order.status === 'SUCCESS') : [];
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
  const pendingOrders = Array.isArray(orders) ? orders.filter((order) => order.status === 'PENDING').length : 0;

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

  const cards = [
    { label: text.completedRevenue, value: formatCurrency(totalRevenue), icon: DollarSign, iconClass: 'bg-green-50 text-green-600' },
    { label: text.currentOrders, value: String(orders.length), icon: TrendingUp, iconClass: 'bg-blue-50 text-blue-600' },
    { label: text.completed, value: String(paidOrders.length), icon: CheckCircle, iconClass: 'bg-purple-50 text-purple-600' },
    { label: text.pending, value: String(pendingOrders), icon: CreditCard, iconClass: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {text.refresh}
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-slate-950 dark:text-white">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{card.label}</div>
            </div>
          );
        })}
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.startDate}</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.endDate}</label>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </div>
          <button onClick={load} className="btn-primary">{text.apply}</button>
          <button onClick={clearFilter} className="btn-secondary">{text.clear}</button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 2 ? 'text-right' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {orders.map((order: any) => {
                  const status = order.status || 'PENDING';
                  const payType = order.payType || order.paymentMethod || '';
                  return (
                    <tr key={order.id || order._id || order.orderNo} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-slate-950 dark:text-white">{order.orderNo || order.id?.substring(0, 12) || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{getUserName(order)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-slate-950 dark:text-white">{formatCurrency(parseFloat(order.amount) || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{payTypeLabel(payType)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(status)}`}>{statusLabel(status)}</span>
                      </td>
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
