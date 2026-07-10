'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, CreditCard, ExternalLink, Mail, RefreshCw, WalletCards } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { walletApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { copyToClipboard } from '@/lib/utils';

type PayType = 'ALIPAY';

const packageItems = [
  { quota: 500, label: '500万余额', featured: true },
  { quota: 1000, label: '1000万余额' },
  { quota: 2000, label: '2000万额度' },
  { quota: 3000, label: '3000万余额' },
  { quota: 5000, label: '5000万余额' },
  { quota: 10000, label: '10000万余额' },
  { quota: 50000, label: '50000万余额' },
  { quota: 300000, label: '高并发3万' },
  { quota: 500000, label: '5万刀高并发' },
];

function priceForQuota(quota: number) {
  return Math.round((quota / 10) * 100) / 100;
}

export default function BalancePage() {
  const { user, fetchProfile } = useAuthStore();
  const [amount, setAmount] = useState(priceForQuota(packageItems[0].quota));
  const [selectedQuota, setSelectedQuota] = useState(packageItems[0].quota);
  const [custom, setCustom] = useState(String(priceForQuota(packageItems[0].quota)));
  const [payment] = useState<PayType>('ALIPAY');
  const [paying, setPaying] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [rechargeConfig, setRechargeConfig] = useState<any>(null);

  useEffect(() => {
    walletApi.getRechargeConfig().then((response) => setRechargeConfig(response.data || null)).catch(() => setRechargeConfig(null));
  }, []);

  const effectiveAmount = Number(custom || amount || 1);

  const selectedPackage = useMemo(() => packageItems.find((item) => item.quota === selectedQuota) || packageItems[0], [selectedQuota]);

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
      toast.success('订单已创建，正在打开支付页面');
      if (data.payUrl) window.open(data.payUrl, '_blank', 'noopener,noreferrer');
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建支付订单失败');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ConsolePage className="pb-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="console-card p-0">
          <div className="border-b border-[#f3d9e5] px-6 py-5">
            <div className="text-2xl font-bold text-[#231f27]">钱包充值</div>
            <div className="mt-1 text-sm text-[#9b8292]">套餐更实惠（0.03-0.06 元/1万）</div>
          </div>

          <div className="p-6">
            <div className="rounded-[26px] border border-[#f1d6e2] bg-white/85 p-5">
              <div className="flex items-center gap-2 text-[#d36b9a]">
                <WalletCards className="h-4 w-4" />
                <div className="font-bold">订阅套餐</div>
              </div>
              <div className="mt-4 rounded-[24px] border border-[#f5e1ea] bg-[#fff9fc] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-[#8f7384]">我的订单 · 2 活跃</div>
                    <div className="mt-1 font-bold text-[#231f27]">当前套餐</div>
                  </div>
                  <div className="rounded-full border border-[#f1d6e2] px-3 py-1 text-xs text-[#8f7384]">优先订阅</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[22px] border border-[#f3d9e5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-[#231f27]">1000万余额 · 订单 #480 <span className="text-emerald-500">生效</span></div>
                      <div className="text-xs text-[#8f7384]">剩余 36159 天</div>
                    </div>
                    <div className="mt-2 text-sm text-[#8f7384]">总额度: $159.51 / $1,000 · 剩余 $840.49 · 已使用 16%</div>
                    <div className="mt-3 h-2 rounded-full bg-[#f6e2eb]">
                      <div className="h-2 w-[16%] rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899]" />
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-[#f3d9e5] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-[#231f27]">500 万余额 · 订单 #439 <span className="text-emerald-500">生效</span></div>
                      <div className="text-xs text-[#8f7384]">剩余 36157 天</div>
                    </div>
                    <div className="mt-2 text-sm text-[#8f7384]">总额度: $499.96 / $500 · 剩余 $0.0374 · 已使用 100%</div>
                    <div className="mt-3 h-2 rounded-full bg-[#f6e2eb]">
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {packageItems.map((item) => {
                  const active = selectedQuota === item.quota;
                  const disabled = item.quota === 500;
                  return (
                    <button
                      key={item.quota}
                      onClick={() => {
                        setSelectedQuota(item.quota);
                        const nextAmount = priceForQuota(item.quota);
                        setAmount(nextAmount);
                        setCustom(String(nextAmount));
                      }}
                      className={`rounded-[26px] border p-5 text-left transition ${active ? 'border-[#f08bb8] bg-[#fff7fb]' : 'border-[#f1d6e2] bg-white/85'} ${disabled ? 'opacity-65' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-[#231f27]">{item.label}</div>
                          <div className="mt-1 text-xs text-[#9b8292]">{(priceForQuota(item.quota) / item.quota).toFixed(4)} 元 / 万</div>
                        </div>
                        {item.featured && <span className="text-xs font-semibold text-[#24b0e0]">推荐</span>}
                      </div>
                      <div className="mt-4 text-3xl font-bold text-[#f062a7]">¥{priceForQuota(item.quota).toFixed(2)}</div>
                      <ul className="mt-4 space-y-2 text-xs text-[#8f7384]">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-pink-400" /> 有效期：99 年</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-pink-400" /> 总额度：${item.quota.toLocaleString()}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-pink-400" /> {item.quota >= 500000 ? '升级分组：高并发' : '限购：1'}</li>
                      </ul>
                      <div className="mt-5 rounded-full border border-[#f1d6e2] bg-white py-2 text-center text-sm font-semibold text-[#6b5363]">
                        {disabled ? '已达上限' : '立即订阅'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="console-card p-5">
            <div className="flex items-center justify-between text-sm text-[#8f7384]">
              <span>当前余额</span>
              <span className="text-[#d36b9a]">余额偏低</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-[#231f27]">${Number(user?.balance || 0).toFixed(2)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">近 24 小时消耗</div>
                <div className="mt-1 text-sm font-bold text-[#231f27]">${priceForQuota(selectedPackage.quota).toFixed(2)}</div>
              </div>
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">可用时长</div>
                <div className="mt-1 text-sm font-bold text-[#f97316]">剩余不足 1 天</div>
              </div>
            </div>
            <button type="button" onClick={() => setCustom(String(priceForQuota(selectedPackage.quota)))} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899] text-sm font-bold text-white">
              钱包充值
            </button>
          </div>

          <div className="console-card p-5">
            <div className="flex items-center justify-between text-sm text-[#8f7384]">
              <span>推荐计划</span>
              <span>当推荐人充值时，即可获得奖励</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">待确认</div>
                <div className="mt-1 font-bold text-[#231f27]">$0</div>
              </div>
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">总收入</div>
                <div className="mt-1 font-bold text-[#231f27]">$0</div>
              </div>
              <div className="rounded-[20px] bg-[#fff7fb] p-3">
                <div className="text-xs text-[#ad8fa0]">邀请</div>
                <div className="mt-1 font-bold text-[#231f27]">0</div>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-[#f1d6e2] bg-white p-4">
              <div className="text-xs text-[#ad8fa0]">您的推荐链接</div>
              <div className="mt-2 rounded-full border border-[#f1d6e2] bg-[#fffafc] px-3 py-2 text-xs text-[#8f7384]">https://api.bblabu.chat/sign-up?aff=ThQ0</div>
              <button className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#f1d6e2] bg-white text-sm font-semibold text-[#6b5363]">
                <Copy className="mr-2 h-4 w-4" />
                复制链接
              </button>
            </div>
          </div>

          <div className="console-card p-5">
            <div className="flex items-center gap-2 text-[#231f27]">
              <CreditCard className="h-4 w-4 text-[#d36b9a]" />
              <div className="font-bold">额度充值</div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-[#8f7384]">兑换码</label>
              <div className="mt-2 flex gap-2">
                <input className="console-input min-w-0 flex-1" placeholder="输入兑换码" />
                <button className="console-button-white px-4">兑换额度</button>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-dashed border-[#f3b9d0] bg-[#fff8fb] p-4">
              <div className="text-center text-sm text-[#8f7384]">需要兑换码？</div>
              <Link href="https://fake.kkliao.cn" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#f1d6e2] bg-white text-sm font-semibold text-[#3e3140]" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                点击进入卡网购买
              </Link>
            </div>
          </div>

          <div className="console-card p-5">
            <div className="flex items-center justify-between text-sm text-[#8f7384]">
              <span>支付通道</span>
              <span>支付宝</span>
            </div>
            <div className="mt-4 rounded-[22px] border border-[#f1d6e2] bg-white p-4">
              <div className="text-sm font-semibold text-[#231f27]">当前网关</div>
              <div className="mt-1 text-xs text-[#8f7384]">{rechargeConfig?.payName || 'ZPay 在线支付'}</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-[#8f7384]">
                <Mail className="h-4 w-4" /> 3315419516@qq.com
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#f1d6e2] bg-white p-4">
                <div className="text-xs text-[#8f7384]">本次充值金额</div>
                <div className="mt-1 text-2xl font-bold text-[#231f27]">¥{effectiveAmount.toFixed(2)}</div>
              </div>
              <div className="rounded-[22px] border border-[#f1d6e2] bg-white p-4">
                <div className="text-xs text-[#8f7384]">订单号</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="min-w-0 flex-1 truncate font-mono text-sm text-[#231f27]">{orderNo || '创建订单后生成'}</div>
                  <button onClick={() => orderNo && copyToClipboard(orderNo)} className="console-icon-button h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={pay} disabled={paying} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899] text-sm font-bold text-white disabled:opacity-60">
                {paying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {paying ? '正在创建订单...' : '立即充值'}
              </button>
              <a href={payUrl || undefined} target="_blank" rel="noreferrer" className={`flex h-12 items-center justify-center gap-2 rounded-full border border-[#f1d6e2] bg-white px-5 text-sm font-bold text-[#231f27] ${!payUrl ? 'pointer-events-none opacity-40' : ''}`}>
                <ExternalLink className="h-4 w-4" />
                打开支付页面
              </a>
            </div>
          </div>
        </aside>
      </div>
    </ConsolePage>
  );
}
