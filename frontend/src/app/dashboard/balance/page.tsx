'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, CreditCard, ExternalLink, Mail, RefreshCw, Wallet } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { walletApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const packages = [1, 10, 20, 50, 100, 200];

type PayType = 'ALIPAY';

export default function BalancePage() {
  const { user, fetchProfile } = useAuthStore();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState('10');
  const [payment] = useState<PayType>('ALIPAY');
  const [paying, setPaying] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [rechargeConfig, setRechargeConfig] = useState<any>(null);

  useEffect(() => {
    walletApi.getRechargeConfig()
      .then((response) => setRechargeConfig(response.data || null))
      .catch(() => setRechargeConfig(null));
  }, []);

  const effectiveAmount = Number(custom || amount || 1);

  const pay = async () => {
    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 1) {
      toast.error('最小充值金额为 ¥1');
      return;
    }

    setPaying(true);
    try {
      const { data } = await walletApi.recharge({ amount: effectiveAmount, payType: payment });
      setOrderNo(data.orderNo || '');
      setPayUrl(data.payUrl || '');
      toast.success('订单已创建，正在打开支付宝收银台');
      if (data.payUrl) window.open(data.payUrl, '_blank', 'noopener,noreferrer');
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建支付订单失败');
    } finally {
      setPaying(false);
    }
  };

  const copyOrderNo = async () => {
    if (!orderNo) return;
    await navigator.clipboard.writeText(orderNo);
    toast.success('订单号已复制');
  };

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">账户充值</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">当前仅支持支付宝。支付成功后系统会通过异步通知自动更新余额。</p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <div className="console-card p-7">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              当前余额
              <Wallet className="h-5 w-5" />
            </div>
            <div className="mt-3 text-4xl font-black text-slate-950 dark:text-white">¥{Number(user?.balance || 0).toFixed(2)}</div>
          </div>

          <div className="console-card p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">支付说明</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                支付成功后由 ZPay 回调自动入账，请不要在支付未完成时重复提交。
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                如果余额长时间未更新，请提供订单号联系客服邮箱核查。
              </div>
            </div>
          </div>

          <div className="console-card p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">联系我们</h2>
            <a
              href="mailto:3315419516@qq.com"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500/20 px-4 font-bold text-slate-800 dark:text-slate-200"
            >
              <Mail className="h-4 w-4" /> 3315419516@qq.com
            </a>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="console-card p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">充值套餐</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {packages.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setAmount(item);
                    setCustom(String(item));
                  }}
                  className={cn('h-[76px] rounded-xl border text-left text-3xl font-black transition', amount === item ? 'border-blue-400 bg-blue-500/10 text-slate-950 dark:text-white' : 'border-slate-300 text-slate-950 hover:border-blue-400 dark:border-slate-600 dark:text-white')}
                >
                  <span className="px-7">¥{item}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="console-card p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">自定义金额</h2>
            <div className="mt-5 max-w-sm">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input value={custom} onChange={(event) => setCustom(event.target.value)} className="console-input w-full pl-10" inputMode="decimal" />
              </div>
              <p className="mt-2 text-xs text-slate-500">最小充值金额 ¥1</p>
            </div>
          </section>

          <section className="console-card p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">支付通道</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button className="rounded-xl border border-blue-400 bg-blue-500/10 p-5 text-left transition">
                <div className="text-xl font-black text-slate-950 dark:text-white">支付宝</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-500">跳转到支付宝收银台完成付款</div>
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-500">当前网关：{rechargeConfig?.payName || 'ZPay 在线支付'}</div>
          </section>

          <section className="console-card p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-300/40 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm text-slate-600 dark:text-slate-400">本次充值金额</div>
                <div className="mt-1 text-2xl font-black text-slate-950 dark:text-white">¥{Number.isFinite(effectiveAmount) ? effectiveAmount.toFixed(2) : '0.00'}</div>
              </div>
              <div className="rounded-xl border border-slate-300/40 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm text-slate-600 dark:text-slate-400">订单号</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="min-w-0 flex-1 truncate font-mono text-slate-950 dark:text-white">{orderNo || '创建订单后生成'}</div>
                  <button onClick={copyOrderNo} disabled={!orderNo} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-950 disabled:opacity-40 dark:border-white/10 dark:text-white">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={pay} disabled={paying} className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-60">
                {paying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {paying ? '正在创建订单...' : '立即充值'}
              </button>
              <a
                href={payUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className={cn('inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 text-sm font-black text-slate-950 transition hover:bg-white/60 dark:border-white/10 dark:text-white dark:hover:bg-white/10', !payUrl && 'pointer-events-none opacity-40')}
              >
                <ExternalLink className="h-4 w-4" />
                打开支付页面
              </a>
            </div>
          </section>
        </main>
      </div>
    </ConsolePage>
  );
}
