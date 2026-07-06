'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, Globe, Shield } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { modelsApi } from '@/lib/api';
import { getProviderName } from '@/components/marketing/modelUtils';

export default function ChannelStatusPage() {
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
          <h1 className="text-3xl font-black text-white">通道状态</h1>
          <p className="mt-2 text-sm text-slate-400">查看当前可用模型供应商与路由健康状态。</p>
        </div>
        <Link href="/dashboard/models" className="console-button-white inline-flex items-center gap-2">
          查看模型广场
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {channels.length === 0 ? (
          <div className="console-card p-6 text-slate-400">暂无可用上游通道，模型同步完成后会自动显示。</div>
        ) : channels.map((channel) => (
          <div key={channel.name} className="console-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-white">{channel.name}</div>
                <div className="mt-1 text-sm text-slate-400">已同步 {channel.count} 个可用模型</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                正常
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="console-card p-6">
          <Activity className="h-6 w-6 text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-white">{models.length}</div>
          <div className="text-sm text-slate-400">已同步模型数</div>
        </div>
        <div className="console-card p-6">
          <Globe className="h-6 w-6 text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-white">{channels.length}</div>
          <div className="text-sm text-slate-400">可用供应商</div>
        </div>
        <div className="console-card p-6">
          <Shield className="h-6 w-6 text-cyan-300" />
          <div className="mt-3 text-2xl font-black text-white">{models.length > 0 ? '正常' : '待同步'}</div>
          <div className="text-sm text-slate-400">路由健康状态</div>
        </div>
      </div>
    </ConsolePage>
  );
}
