'use client';

import { useState } from 'react';
import { CreditCard, Gauge, Settings, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export default function AdminSettingsPage() {
  const [rateLimit, setRateLimit] = useState({
    enabled: true,
    maxRequests: 120,
    windowMs: 60000,
  });

  const [payments, setPayments] = useState({
    alipay: true,
    wechat: true,
    stripe: false,
    usdt: false,
  });

  const [general, setGeneral] = useState({
    allowRegistration: true,
    requireInviteCode: false,
    maintenanceMode: false,
  });

  const handleSave = (section: string) => {
    toast.success(`${section} 已保存到演示状态，真实系统参数请通过环境变量和部署配置调整。`);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">系统参数</h1>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">只读演示配置</span>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <Gauge className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">限流配置</h2>
          </div>
          <div className="space-y-4">
            <ToggleSwitch enabled={rateLimit.enabled} onChange={(value) => setRateLimit((current) => ({ ...current, enabled: value }))} label="启用请求限流" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">最大请求数</label>
                <input type="number" value={rateLimit.maxRequests} onChange={(event) => setRateLimit((current) => ({ ...current, maxRequests: parseInt(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" disabled={!rateLimit.enabled} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">时间窗口（毫秒）</label>
                <input type="number" value={rateLimit.windowMs} onChange={(event) => setRateLimit((current) => ({ ...current, windowMs: parseInt(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" disabled={!rateLimit.enabled} />
              </div>
            </div>
            <button onClick={() => handleSave('限流配置')} className="btn-primary">保存限流配置</button>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">支付方式</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch enabled={payments.alipay} onChange={(value) => setPayments((current) => ({ ...current, alipay: value }))} label="支付宝" />
            <ToggleSwitch enabled={payments.wechat} onChange={(value) => setPayments((current) => ({ ...current, wechat: value }))} label="微信支付" />
            <ToggleSwitch enabled={payments.stripe} onChange={(value) => setPayments((current) => ({ ...current, stripe: value }))} label="Stripe" />
            <ToggleSwitch enabled={payments.usdt} onChange={(value) => setPayments((current) => ({ ...current, usdt: value }))} label="USDT" />
          </div>
          <button onClick={() => handleSave('支付配置')} className="btn-primary mt-4">保存支付配置</button>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">通用配置</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch enabled={general.allowRegistration} onChange={(value) => setGeneral((current) => ({ ...current, allowRegistration: value }))} label="允许用户注册" />
            <ToggleSwitch enabled={general.requireInviteCode} onChange={(value) => setGeneral((current) => ({ ...current, requireInviteCode: value }))} label="注册必须填写邀请码" />
            <ToggleSwitch enabled={general.maintenanceMode} onChange={(value) => setGeneral((current) => ({ ...current, maintenanceMode: value }))} label="维护模式" />
          </div>
          <button onClick={() => handleSave('通用配置')} className="btn-primary mt-4">保存通用配置</button>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold">系统信息</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span className="text-gray-500">版本</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span className="text-gray-500">运行环境</span>
              <span className="font-mono">Production</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span className="text-gray-500">API 地址</span>
              <span className="font-mono text-primary-600">/api</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">最近部署</span>
              <span className="text-gray-700">当前线上版本</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
