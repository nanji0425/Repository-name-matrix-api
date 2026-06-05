'use client';

import { useState } from 'react';
import { Settings, Shield, Gauge, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export default function AdminSettingsPage() {
  const [rateLimit, setRateLimit] = useState({
    enabled: true,
    maxRequests: 100,
    windowMs: 60000,
  });

  const [payments, setPayments] = useState({
    alipay: true,
    wechat: true,
    creditCard: false,
    crypto: false,
  });

  const [general, setGeneral] = useState({
    allowRegistration: true,
    requireInviteCode: false,
    maintenanceMode: false,
    emailVerification: false,
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved (UI demo)`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Read-Only Demo</span>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Rate Limit Config */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-50">
              <Gauge className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="font-semibold text-lg">Rate Limit Configuration</h2>
          </div>
          <div className="space-y-4">
            <ToggleSwitch
              enabled={rateLimit.enabled}
              onChange={(v) => setRateLimit(r => ({ ...r, enabled: v }))}
              label="Enable Rate Limiting"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Requests</label>
                <input
                  type="number"
                  value={rateLimit.maxRequests}
                  onChange={e => setRateLimit(r => ({ ...r, maxRequests: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={!rateLimit.enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Window (ms)</label>
                <input
                  type="number"
                  value={rateLimit.windowMs}
                  onChange={e => setRateLimit(r => ({ ...r, windowMs: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={!rateLimit.enabled}
                />
              </div>
            </div>
            <button onClick={() => handleSave('Rate limit')} className="btn-primary">Save Rate Limits</button>
          </div>
        </div>

        {/* Payment Switches */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-semibold text-lg">Payment Methods</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              enabled={payments.alipay}
              onChange={(v) => setPayments(p => ({ ...p, alipay: v }))}
              label="Alipay"
            />
            <ToggleSwitch
              enabled={payments.wechat}
              onChange={(v) => setPayments(p => ({ ...p, wechat: v }))}
              label="WeChat Pay"
            />
            <ToggleSwitch
              enabled={payments.creditCard}
              onChange={(v) => setPayments(p => ({ ...p, creditCard: v }))}
              label="Credit Card"
            />
            <ToggleSwitch
              enabled={payments.crypto}
              onChange={(v) => setPayments(p => ({ ...p, crypto: v }))}
              label="Cryptocurrency"
            />
          </div>
          <button onClick={() => handleSave('Payment')} className="btn-primary mt-4">Save Payment Settings</button>
        </div>

        {/* General Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-lg">General Settings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              enabled={general.allowRegistration}
              onChange={(v) => setGeneral(g => ({ ...g, allowRegistration: v }))}
              label="Allow User Registration"
            />
            <ToggleSwitch
              enabled={general.requireInviteCode}
              onChange={(v) => setGeneral(g => ({ ...g, requireInviteCode: v }))}
              label="Require Invite Code for Registration"
            />
            <ToggleSwitch
              enabled={general.maintenanceMode}
              onChange={(v) => setGeneral(g => ({ ...g, maintenanceMode: v }))}
              label="Maintenance Mode"
            />
            <ToggleSwitch
              enabled={general.emailVerification}
              onChange={(v) => setGeneral(g => ({ ...g, emailVerification: v }))}
              label="Email Verification Required"
            />
          </div>
          <button onClick={() => handleSave('General')} className="btn-primary mt-4">Save General Settings</button>
        </div>

        {/* System Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-50">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="font-semibold text-lg">System Information</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Environment</span>
              <span className="font-mono">Production</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">API Base URL</span>
              <span className="font-mono text-primary-600">/api</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Last Deployment</span>
              <span className="text-gray-700">N/A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
