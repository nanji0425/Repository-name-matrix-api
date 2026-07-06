'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, Globe, Shield } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { modelsApi } from '@/lib/api';
import { getProviderName } from '@/components/marketing/modelUtils';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '通道状态',
    desc: '查看当前可用模型供应商与路由健康状态。',
    viewModels: '查看模型广场',
    empty: '暂无可用上游通道，模型同步完成后会自动显示。',
    synced: '已同步',
    availableModels: '个可用模型',
    normal: '正常',
    pending: '待同步',
    modelCount: '已同步模型数',
    providerCount: '可用供应商',
    routeHealth: '路由健康状态',
  },
  en: {
    title: 'Channel Status',
    desc: 'View available model providers and routing health.',
    viewModels: 'View Models',
    empty: 'No upstream channels are available yet. They will appear after model sync completes.',
    synced: 'Synced',
    availableModels: 'available models',
    normal: 'Healthy',
    pending: 'Pending sync',
    modelCount: 'Synced Models',
    providerCount: 'Available Providers',
    routeHealth: 'Routing Health',
  },
} as const;

export default function ChannelStatusPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    modelsApi.listActive().then((response) => setModels(Array.isArray(response.data) ? response.data : [])).catch(() => setModels([]));
  }, []);

  const channels = useMemo(() => {
    const names = Array.from(new Set(models.map(getProviderName).filter(Boolean)));
    return names.length ? names.map((name) => ({ name, count: models.filter((model) => getProviderName(model) === name).length })) : [];
  }, [models]);

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <Link href="/dashboard/models" className="console-button-white inline-flex items-center gap-2">
          {text.viewModels}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {channels.length === 0 ? (
          <div className="console-card p-6 text-slate-500">{text.empty}</div>
        ) : channels.map((channel) => (
          <div key={channel.name} className="console-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-950 dark:text-white">{channel.name}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text.synced} {channel.count} {text.availableModels}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {text.normal}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="console-card p-6">
          <Activity className="h-6 w-6 text-cyan-500 dark:text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{models.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.modelCount}</div>
        </div>
        <div className="console-card p-6">
          <Globe className="h-6 w-6 text-cyan-500 dark:text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{channels.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.providerCount}</div>
        </div>
        <div className="console-card p-6">
          <Shield className="h-6 w-6 text-cyan-500 dark:text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{models.length > 0 ? text.normal : text.pending}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.routeHealth}</div>
        </div>
      </div>
    </ConsolePage>
  );
}
