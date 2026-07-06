'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Gauge, RefreshCw, Save, Settings, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';
import { systemSettingsApi } from '@/lib/api';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

type SettingsState = {
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  payments: {
    alipay: boolean;
  };
  general: {
    allowRegistration: boolean;
    requireInviteCode: boolean;
    maintenanceMode: boolean;
  };
  systemInfo?: {
    version?: string;
    environment?: string;
    apiAddress?: string;
  };
};

function ToggleSwitch({ enabled, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <label className={`flex items-center justify-between py-3 ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-sm text-gray-700 dark:text-slate-300">{label}</span>
      <button type="button" disabled={disabled} onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed ${enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

const defaultSettings: SettingsState = {
  rateLimit: {
    enabled: true,
    maxRequests: 120,
    windowMs: 60000,
  },
  payments: {
    alipay: true,
  },
  general: {
    allowRegistration: true,
    requireInviteCode: false,
    maintenanceMode: false,
  },
};

const copy = {
  zh: {
    title: '系统参数',
    persisted: '已接入服务端配置',
    saveToast: '{section} 已保存',
    loadFailed: '系统设置加载失败',
    saveFailed: '系统设置保存失败',
    refresh: '刷新',
    rateLimit: '限流配置',
    enableRateLimit: '启用请求限流',
    maxRequests: '最大请求数',
    windowMs: '时间窗口（毫秒）',
    saveRateLimit: '保存限流配置',
    paymentMethods: '支付方式',
    alipay: '支付宝',
    savePayment: '保存支付配置',
    general: '通用配置',
    allowRegistration: '允许用户注册',
    requireInviteCode: '注册必须填写邀请码',
    maintenanceMode: '维护模式',
    saveGeneral: '保存通用配置',
    systemInfo: '系统信息',
    version: '版本',
    environment: '运行环境',
    apiAddress: 'API 地址',
    latestDeploy: '最近部署',
    currentOnline: '当前线上版本',
    paymentNote: '当前线上充值仅开放支付宝，其他支付方式不会在用户端展示。',
  },
  en: {
    title: 'System Parameters',
    persisted: 'Connected to server settings',
    saveToast: '{section} saved',
    loadFailed: 'Failed to load system settings',
    saveFailed: 'Failed to save system settings',
    refresh: 'Refresh',
    rateLimit: 'Rate Limit',
    enableRateLimit: 'Enable request rate limit',
    maxRequests: 'Max requests',
    windowMs: 'Window (ms)',
    saveRateLimit: 'Save Rate Limit',
    paymentMethods: 'Payment Methods',
    alipay: 'Alipay',
    savePayment: 'Save Payment Config',
    general: 'General',
    allowRegistration: 'Allow user registration',
    requireInviteCode: 'Require invite code',
    maintenanceMode: 'Maintenance mode',
    saveGeneral: 'Save General Config',
    systemInfo: 'System Info',
    version: 'Version',
    environment: 'Environment',
    apiAddress: 'API URL',
    latestDeploy: 'Latest Deploy',
    currentOnline: 'Current production version',
    paymentNote: 'Only Alipay recharge is currently enabled online. Other payment methods are hidden from users.',
  },
} as const;

export default function AdminSettingsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await systemSettingsApi.get();
      setSettings({ ...defaultSettings, ...data });
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async (section: keyof Pick<SettingsState, 'rateLimit' | 'payments' | 'general'>, label: string) => {
    setSavingSection(section);
    try {
      const { data } = await systemSettingsApi.update({ [section]: settings[section] });
      setSettings({ ...defaultSettings, ...data });
      toast.success(text.saveToast.replace('{section}', label));
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.saveFailed);
    } finally {
      setSavingSection('');
    }
  };

  const cardClass = 'card p-6 dark:border-white/10 dark:bg-white/[0.04]';
  const inputClass = 'w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-white';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
          <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">{text.persisted}</span>
        </div>
        <button onClick={loadSettings} disabled={loading} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {text.refresh}
        </button>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <Gauge className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{text.rateLimit}</h2>
          </div>
          <div className="space-y-4">
            <ToggleSwitch enabled={settings.rateLimit.enabled} onChange={(value) => setSettings((current) => ({ ...current, rateLimit: { ...current.rateLimit, enabled: value } }))} label={text.enableRateLimit} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.maxRequests}</label>
                <input type="number" value={settings.rateLimit.maxRequests} onChange={(event) => setSettings((current) => ({ ...current, rateLimit: { ...current.rateLimit, maxRequests: parseInt(event.target.value) || 1 } }))} className={inputClass} disabled={!settings.rateLimit.enabled} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.windowMs}</label>
                <input type="number" value={settings.rateLimit.windowMs} onChange={(event) => setSettings((current) => ({ ...current, rateLimit: { ...current.rateLimit, windowMs: parseInt(event.target.value) || 1000 } }))} className={inputClass} disabled={!settings.rateLimit.enabled} />
              </div>
            </div>
            <button onClick={() => saveSettings('rateLimit', text.rateLimit)} disabled={savingSection === 'rateLimit'} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"><Save className="h-4 w-4" /> {text.saveRateLimit}</button>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{text.paymentMethods}</h2>
          </div>
          <p className="mb-2 text-sm text-gray-500 dark:text-slate-400">{text.paymentNote}</p>
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            <ToggleSwitch enabled={settings.payments.alipay} onChange={(value) => setSettings((current) => ({ ...current, payments: { ...current.payments, alipay: value } }))} label={text.alipay} />
          </div>
          <button onClick={() => saveSettings('payments', text.paymentMethods)} disabled={savingSection === 'payments'} className="btn-primary mt-4 inline-flex items-center gap-2 disabled:opacity-60"><Save className="h-4 w-4" /> {text.savePayment}</button>
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{text.general}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            <ToggleSwitch enabled={settings.general.allowRegistration} onChange={(value) => setSettings((current) => ({ ...current, general: { ...current.general, allowRegistration: value } }))} label={text.allowRegistration} />
            <ToggleSwitch enabled={settings.general.requireInviteCode} onChange={(value) => setSettings((current) => ({ ...current, general: { ...current.general, requireInviteCode: value } }))} label={text.requireInviteCode} />
            <ToggleSwitch enabled={settings.general.maintenanceMode} onChange={(value) => setSettings((current) => ({ ...current, general: { ...current.general, maintenanceMode: value } }))} label={text.maintenanceMode} />
          </div>
          <button onClick={() => saveSettings('general', text.general)} disabled={savingSection === 'general'} className="btn-primary mt-4 inline-flex items-center gap-2 disabled:opacity-60"><Save className="h-4 w-4" /> {text.saveGeneral}</button>
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{text.systemInfo}</h2>
          </div>
          <div className="space-y-2 text-sm">
            {[
              [text.version, settings.systemInfo?.version || '1.0.0'],
              [text.environment, settings.systemInfo?.environment || 'Production'],
              [text.apiAddress, settings.systemInfo?.apiAddress || '/api'],
              [text.latestDeploy, text.currentOnline],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-100 py-2 last:border-b-0 dark:border-white/10">
                <span className="text-gray-500">{label}</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
