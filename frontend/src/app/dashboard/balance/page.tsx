'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { walletApi, ordersApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Wallet, TrendingUp, History, CreditCard, Gift, CheckCircle,
  Lock, Zap, Sparkles, FileText, Search, ChevronLeft, ChevronRight,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──
type OrderStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
type RechargeStep = 'amount' | 'payment';

interface OrderItem {
  id: string;
  orderNo: string;
  paymentMethod: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'ant-tag ant-tag-green' },
  PENDING: { label: 'Pending', className: 'ant-tag ant-tag-orange' },
  FAILED: { label: 'Failed', className: 'ant-tag ant-tag-red' },
  CANCELLED: { label: 'Cancelled', className: 'ant-tag ant-tag-default' },
};

const PAGE_SIZE = 10;

// Simple exchange rate (CNY to USD)
const EXCHANGE_RATE = 0.137;

export default function BalancePage() {
  const { user, fetchProfile } = useAuthStore();

  // ── Step flow state ──
  const [step, setStep] = useState<RechargeStep>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALIPAY');

  // ── Order confirmation ──
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [recharging, setRecharging] = useState(false);

  // ── Redeem code ──
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // ── Order history ──
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);

  // ── Stats ──
  const [historicalConsumption, setHistoricalConsumption] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  // ── Derived values ──
  const effectiveAmount = useMemo(() => {
    if (customAmount && parseFloat(customAmount) > 0) return parseFloat(customAmount);
    return selectedAmount;
  }, [selectedAmount, customAmount]);

  const usdAmount = useMemo(() => effectiveAmount * EXCHANGE_RATE, [effectiveAmount]);

  // ── Fetch orders & stats ──
  const fetchOrders = useCallback(async (page: number) => {
    setOrderLoading(true);
    try {
      const res = await ordersApi.list({ page, pageSize: PAGE_SIZE, sort: 'createdAt', order: 'desc' });
      const data = res.data;
      setOrders(data.orders || data.list || data.data || []);
      setOrderTotal(data.total || data.count || 0);
    } catch {
      // ignore
    } finally {
      setOrderLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(orderPage);
    fetchProfile();
    // Fetch historical consumption and request count from stats
    walletApi.getLogs({ page: 1, pageSize: 1000 }).then((res) => {
      const logs = res.data?.logs || res.data || [];
      let totalCost = 0;
      logs.forEach((log: any) => {
        if (log.type === 'RECHARGE' || log.type === 'DEPOSIT') {
          // count as consumption-inverse for display
        } else if (log.amount && log.amount < 0) {
          totalCost += Math.abs(log.amount);
        }
      });
      setHistoricalConsumption(totalCost);
      setRequestCount(logs.length);
    }).catch(() => {});
  }, []);

  // ── Step navigation ──
  const goToPayment = () => {
    if (effectiveAmount < 10) {
      toast.error('Minimum recharge amount is $10.00');
      return;
    }
    setStep('payment');
  };

  const goBackToAmount = () => {
    setStep('amount');
  };

  // ── Handle amount selection ──
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) return;
    setCustomAmount(cleaned);
    if (cleaned) {
      setSelectedAmount(0); // Deselect quick buttons
    }
  };

  // ── Handle recharge ──
  const handleRecharge = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }
    if (effectiveAmount < 10) {
      toast.error('Minimum recharge amount is $10.00');
      return;
    }
    setRecharging(true);
    try {
      await walletApi.recharge({ amount: effectiveAmount, payType: selectedPayment });
      toast.success('Recharge initiated successfully!');
      await fetchProfile();
      await fetchOrders(1);
      setOrderPage(1);
      setStep('amount');
      setSelectedAmount(10);
      setCustomAmount('');
      setAgreedToTerms(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Recharge failed';
      toast.error(msg);
    } finally {
      setRecharging(false);
    }
  };

  // ── Handle redeem ──
  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Please enter a redeem code');
      return;
    }
    setRedeeming(true);
    try {
      // POST /wallet/redeem endpoint — we use the generic api pattern
      const { default: api } = await import('@/lib/api');
      await api.post('/wallet/redeem', { code: redeemCode.trim() });
      toast.success('Redeem code applied successfully!');
      setRedeemCode('');
      await fetchProfile();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Redeem failed';
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(orderTotal / PAGE_SIZE));

  const handlePrevPage = () => {
    if (orderPage > 1) {
      const next = orderPage - 1;
      setOrderPage(next);
      fetchOrders(next);
    }
  };

  const handleNextPage = () => {
    if (orderPage < totalPages) {
      const next = orderPage + 1;
      setOrderPage(next);
      fetchOrders(next);
    }
  };

  // ── Render ──
  const currentBalance = user?.balance ?? 0;

  return (
    <div>
      {/* ── Page Title ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Recharge</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Add credits to your account to continue using CodeToken AI services
        </p>
      </div>

      {/* ================================================================= */}
      {/* TOP STATS BAR                                                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="stat-label">Current Balance</span>
          </div>
          <div className="stat-value">{formatCurrency(currentBalance)}</div>
          <div className="stat-footer">Available balance</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            <span className="stat-label">Historical Consumption</span>
          </div>
          <div className="stat-value">{formatCurrency(historicalConsumption)}</div>
          <div className="stat-footer">Total amount spent</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span className="stat-label">Request Count</span>
          </div>
          <div className="stat-value">{requestCount.toLocaleString()}</div>
          <div className="stat-footer">Total API requests</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="stat-label">This Deposit</span>
          </div>
          <div className="stat-value">{formatCurrency(effectiveAmount)}</div>
          <div className="stat-footer">Selected recharge amount</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* RECHARGE FLOW — TWO STEPS                                        */}
      {/* ================================================================= */}
      <div className="ant-card mb-8">
        {/* Steps indicator */}
        <div className="ant-steps">
          <div className="ant-steps-item">
            <div className={`ant-steps-icon ${step === 'amount' ? 'active' : step === 'payment' ? 'completed' : ''}`}>
              {step === 'payment' ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <div className="ant-steps-content">
              <div className="ant-steps-title" style={{ color: step === 'amount' ? 'var(--primary)' : 'var(--text-primary)' }}>
                Select Amount
              </div>
              <div className="ant-steps-description">Choose recharge amount</div>
            </div>
            <div className={`ant-steps-tail ${step === 'payment' ? 'active' : ''}`} />
          </div>
          <div className="ant-steps-item">
            <div className={`ant-steps-icon ${step === 'payment' ? 'active' : ''}`}>2</div>
            <div className="ant-steps-content">
              <div className="ant-steps-title" style={{ color: step === 'payment' ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                Payment Method
              </div>
              <div className="ant-steps-description">Complete payment</div>
            </div>
          </div>
        </div>

        {/* ── STEP 1: Select Amount ── */}
        {step === 'amount' && (
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Select Amount
            </h3>

            {/* Quick select radio buttons */}
            <div className="ant-radio-group mb-4">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`ant-radio-button ant-radio-button-lg ${
                    selectedAmount === amount && !customAmount ? 'active' : ''
                  } ${amount === 50 ? 'ant-radio-button-recommend' : ''}`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Or enter a custom amount
              </label>
              <div className="flex items-center gap-2" style={{ maxWidth: 300 }}>
                <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="10.00"
                  className="ant-input ant-input-lg"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Minimum recharge amount is $10.00
              </p>
            </div>

            <div className="ant-divider" />

            {/* Next step button */}
            <div className="flex justify-end">
              <button
                onClick={goToPayment}
                className="ant-btn ant-btn-primary ant-btn-lg"
              >
                Next: Select Payment Method
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Select Payment Method ── */}
        {step === 'payment' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={goBackToAmount}
                className="ant-btn ant-btn-link"
                style={{ padding: 0 }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Select Payment Method
            </h3>

            {/* Payment method card — Alipay only */}
            <div
              className={`payment-method ${selectedPayment === 'ALIPAY' ? 'active' : ''}`}
              onClick={() => setSelectedPayment('ALIPAY')}
              style={{ maxWidth: 400 }}
            >
              <div className="payment-method-icon alipay">
                <span className="font-bold text-xs">支</span>
              </div>
              <div className="flex-1">
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  支付宝 (Alipay)
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Secure payment via Alipay
                </div>
              </div>
              {selectedPayment === 'ALIPAY' && (
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              )}
            </div>

            <div className="ant-divider" />

            {/* ── Order Confirmation Panel ── */}
            <div className="ant-card" style={{ maxWidth: 500, background: '#fafafa' }}>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Order Summary
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Recharge Amount</span>
                  <span className="font-medium">{formatCurrency(effectiveAmount)}</span>
                </div>

                <div className="ant-divider" style={{ margin: '8px 0' }} />

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Discount</span>
                  <span className="text-sm" style={{ color: 'var(--success)' }}>¥0.00</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Actual Payment</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                    ¥{effectiveAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimated Credit</span>
                  <span className="font-medium">{formatCurrency(effectiveAmount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment Conversion</span>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    ¥{effectiveAmount.toFixed(2)} ≈ ${usdAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
                  <span className="text-sm font-medium">Alipay</span>
                </div>
              </div>

              <div className="ant-divider" />

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  I have read and agree to the{' '}
                  <a href="/docs/terms" target="_blank" style={{ color: 'var(--primary)' }}>
                    Terms of Service
                  </a>
                </span>
              </label>

              {/* Pay button */}
              <button
                onClick={handleRecharge}
                disabled={recharging || !agreedToTerms}
                className="ant-btn ant-btn-primary ant-btn-lg w-full"
              >
                {recharging ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay Now ¥{effectiveAmount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* REDEEM CODE SECTION                                             */}
      {/* ================================================================= */}
      <div className="ant-card mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary-bg)' }}
            >
              <Gift className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Redeem Code
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Redeem code to directly exchange for credit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Enter your redeem code"
              className="ant-input"
              style={{ minWidth: 200, flex: 1 }}
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
              className="ant-btn ant-btn-primary"
            >
              {redeeming ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* RECHARGE HISTORY TABLE                                           */}
      {/* ================================================================= */}
      <div className="ant-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Recharge History
          </h3>
        </div>

        {orderLoading ? (
          <div className="py-12 text-center">
            <div
              className="animate-spin w-6 h-6 border-2 rounded-full mx-auto"
              style={{
                borderColor: 'var(--border)',
                borderTopColor: 'var(--primary)',
              }}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <History className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No recharge records yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Your recharge history will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="ant-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {order.orderNo || order.id}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {order.paymentMethod === 'ALIPAY' ? 'Alipay' :
                           order.paymentMethod === 'WECHAT' ? 'WeChat Pay' :
                           order.paymentMethod === 'STRIPE' ? 'Stripe' :
                           order.paymentMethod || '—'}
                        </span>
                      </td>
                      <td className="font-medium">{formatCurrency(order.amount || 0)}</td>
                      <td>
                        <span className={STATUS_CONFIG[order.status]?.className || 'ant-tag ant-tag-default'}>
                          {STATUS_CONFIG[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Showing {(orderPage - 1) * PAGE_SIZE + 1}–{Math.min(orderPage * PAGE_SIZE, orderTotal)} of {orderTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={orderPage <= 1}
                    className="ant-btn ant-btn-sm"
                    style={{ opacity: orderPage <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-sm px-2" style={{ color: 'var(--text-secondary)' }}>
                    {orderPage} / {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={orderPage >= totalPages}
                    className="ant-btn ant-btn-sm"
                    style={{ opacity: orderPage >= totalPages ? 0.5 : 1 }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================= */}
      {/* PAYMENT INFO FOOTER                                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="ant-card ant-card-small text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#f6ffed' }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
              Payment successful,<br />credit auto-added
            </span>
          </div>
        </div>

        <div className="ant-card ant-card-small text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#e6f4ff' }}
            >
              <Lock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
              Secure — multiple<br />payment protection
            </span>
          </div>
        </div>

        <div className="ant-card ant-card-small text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#fff7e6' }}
            >
              <Zap className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
              Instant credit —<br />auto-add after payment
            </span>
          </div>
        </div>

        <div className="ant-card ant-card-small text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#fff0f6' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: '#eb2f96' }} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
              Bonus — extra<br />discount on recharge
            </span>
          </div>
        </div>

        <div className="ant-card ant-card-small text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#f0f5ff' }}
            >
              <FileText className="w-5 h-5" style={{ color: '#2f54eb' }} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
              Invoice — supports<br />regular invoice
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
