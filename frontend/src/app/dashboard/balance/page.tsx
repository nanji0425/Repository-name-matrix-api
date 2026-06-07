'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, ChevronDown, CreditCard, Mail } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { walletApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const packages = [1, 10, 20, 50, 100, 200];
const faqs = ['余额可以用于网站上的所有模型吗?', '余额是否长期有效?', '大规模使用是否可以获得折扣?', '如何获取更多优惠?'];

export default function BalancePage() {
  const { user, fetchProfile } = useAuthStore();
  const [amount, setAmount] = useState(1);
  const [custom, setCustom] = useState('10');
  const [redeem, setRedeem] = useState('');
  const [payment, setPayment] = useState('支付宝');
  const [paying, setPaying] = useState(false);

  const effectiveAmount = Number(custom || amount || 1);

  const pay = async () => {
    setPaying(true);
    try {
      await walletApi.recharge({ amount: effectiveAmount, payType: payment === '支付宝' ? 'ALIPAY' : 'WECHAT' });
      toast.success('支付订单已创建');
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建支付订单失败');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ConsolePage className="pb-24">
      <h1 className="text-3xl font-black text-white">账户</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <div className="console-card p-7">
            <div className="flex items-center justify-between text-sm text-slate-400">
              当前余额
              <Bell className="h-5 w-5" />
            </div>
            <div className="mt-3 text-4xl font-black text-white">¥{Number(user?.balance || 0).toFixed(2)}</div>
          </div>

          <div className="console-card p-7">
            <h2 className="text-lg font-black text-white">常见问题</h2>
            <div className="mt-5 divide-y divide-white/10">
              {faqs.map((faq) => (
                <button key={faq} className="flex w-full items-center justify-between py-4 text-left text-sm text-slate-300">
                  {faq}
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="console-card p-7">
            <h2 className="text-lg font-black text-white">联系我们</h2>
            <a href="mailto:support@matrixapi.ai" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500/20 px-4 font-bold text-slate-200">
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="console-card p-7">
            <h2 className="text-lg font-black text-white">充值套餐</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {packages.map((item) => (
                <button key={item} onClick={() => { setAmount(item); setCustom(String(item)); }} className={cn('h-[76px] rounded-xl border text-left text-3xl font-black transition', amount === item ? 'border-blue-400 bg-blue-500/10 text-white' : 'border-slate-600 text-white hover:border-blue-400')}>
                  <span className="px-7">¥{item}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="console-card p-7">
            <h2 className="text-lg font-black text-white">自定义金额 (CNY)</h2>
            <div className="mt-5 max-w-sm">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input value={custom} onChange={(event) => setCustom(event.target.value)} className="console-input w-full pl-10" />
              </div>
              <p className="mt-2 text-xs text-slate-500">最小充值金额 ¥1</p>
            </div>
          </section>

          <section className="console-card p-7">
            <h2 className="text-lg font-black text-white">兑换码充值</h2>
            <div className="mt-5 flex max-w-xl gap-3">
              <input value={redeem} onChange={(event) => setRedeem(event.target.value)} className="console-input flex-1" placeholder="输入兑换码" />
              <button onClick={() => toast('兑换码功能开发中')} className="h-[50px] rounded-xl bg-slate-700 px-6 font-black text-white">兑换</button>
            </div>
          </section>

          <section className="console-card p-7">
            <h2 className="text-lg font-black text-white">选择支付方式</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {['支付宝', '微信'].map((item) => (
                <button key={item} onClick={() => setPayment(item)} className={cn('h-[92px] rounded-xl border text-center transition', payment === item ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600')}>
                  <div className="text-2xl font-black text-white">{item}</div>
                  <div className="mt-1 text-sm text-slate-500">{item === '支付宝' ? 'Alipay' : 'WeChat Pay'}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="console-card p-7">
            <button onClick={pay} disabled={paying} className="h-14 w-full rounded-xl bg-slate-200 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-60">
              <CreditCard className="mr-2 inline h-4 w-4" />
              {paying ? '正在创建订单...' : '立即支付'}
            </button>
          </section>
        </main>
      </div>
    </ConsolePage>
  );
}
