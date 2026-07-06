'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Globe, KeyRound } from 'lucide-react';
import { modelsApi } from '@/lib/api';
import { formatModelPrice, getProviderName } from '@/components/marketing/modelUtils';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    modelsApi
      .listActive()
      .then((response) => setModels(Array.isArray(response.data) ? response.data : []))
      .catch(() => setModels([]));
  }, []);

  const providerList = useMemo(() => Array.from(new Set(models.map(getProviderName))), [models]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">模型广场</h1>
          <p className="mt-2 text-sm text-slate-400">所有模型按上游价格加价 30% 展示，便于统一对外销售。</p>
        </div>
        <Link href="/dashboard/api-keys" className="console-button-white inline-flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          获取 API Key
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">模型数量</div>
          <div className="mt-2 text-2xl font-black text-white">{models.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">供应商数</div>
          <div className="mt-2 text-2xl font-black text-white">{providerList.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">同步状态</div>
          <div className="mt-2 text-2xl font-black text-white">自动</div>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">
          当前还没有可用模型，系统会在后台自动同步上游模型。
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model: any) => (
            <div key={model.id} className="console-card p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <Brain className="h-4 w-4 text-cyan-300" />
                    <div className="font-black">{model.name}</div>
                  </div>
                  <code className="mt-2 inline-block rounded-full bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300">
                    {model.modelCode}
                  </code>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                  {model.status || 'ACTIVE'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <div className="text-xs text-slate-500">输入价格</div>
                  <div className="mt-1 font-bold text-white">{formatModelPrice(model.inputPrice, '按量计费')}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <div className="text-xs text-slate-500">输出价格</div>
                  <div className="mt-1 font-bold text-white">{formatModelPrice(model.outputPrice, '按量计费')}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-4 w-4 text-cyan-300" />
                  {getProviderName(model)}
                </span>
                <span>{model.multiplier ? `倍率 ${model.multiplier}x` : '默认倍率'}</span>
              </div>

              <Link href="/dashboard/api-keys" className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-slate-950 transition hover:bg-cyan-100">
                选择该模型创建 Key
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
