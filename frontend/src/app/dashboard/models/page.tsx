'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Globe, KeyRound } from 'lucide-react';
import { modelsApi } from '@/lib/api';
import { formatModelPrice, getFilterLabel, getProviderName } from '@/components/marketing/modelUtils';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '模型广场',
    desc: '所有模型按上游价格加价 40% 展示，便于统一对外销售。',
    getKey: '获取 API Key',
    modelCount: '模型数量',
    providerCount: '供应商数',
    syncStatus: '同步状态',
    automatic: '自动',
    empty: '当前还没有可用模型，系统会在后台自动同步上游模型。',
    inputPrice: '输入价格',
    outputPrice: '输出价格',
    multiplier: '倍率',
    defaultMultiplier: '默认倍率',
    chooseModel: '选择该模型创建 Key',
  },
  en: {
    title: 'Model Marketplace',
    desc: 'Models are displayed with a 40% markup over upstream prices for unified sales.',
    getKey: 'Get API Key',
    modelCount: 'Models',
    providerCount: 'Providers',
    syncStatus: 'Sync Status',
    automatic: 'Automatic',
    empty: 'No available models yet. The system will sync upstream models in the background.',
    inputPrice: 'Input Price',
    outputPrice: 'Output Price',
    multiplier: 'Multiplier',
    defaultMultiplier: 'Default Multiplier',
    chooseModel: 'Create Key For This Model',
  },
} as const;

export default function ModelsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <Link href="/dashboard/api-keys" className="console-button-white inline-flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          {text.getKey}
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.modelCount}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{models.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.providerCount}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{providerList.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.syncStatus}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{text.automatic}</div>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-cyan-700/15 bg-white/70 p-12 text-center text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">{text.empty}</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model: any) => (
            <div key={model.id} className="console-card p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                    <Brain className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                    <div className="font-black">{model.name}</div>
                  </div>
                  <code className="mt-2 inline-block rounded-full bg-white/70 px-2.5 py-1 font-mono text-xs text-slate-700 dark:bg-white/5 dark:text-slate-300">{model.modelCode}</code>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{model.status || 'ACTIVE'}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/[0.03]">
                  <div className="text-xs text-slate-500">{text.inputPrice}</div>
                  <div className="mt-1 font-bold text-slate-950 dark:text-white">{formatModelPrice(model.inputPrice, 'usage', locale)}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/[0.03]">
                  <div className="text-xs text-slate-500">{text.outputPrice}</div>
                  <div className="mt-1 font-bold text-slate-950 dark:text-white">{formatModelPrice(model.outputPrice, 'usage', locale)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                  {getFilterLabel(getProviderName(model), locale)}
                </span>
                <span>{model.multiplier ? `${text.multiplier} ${model.multiplier}x` : text.defaultMultiplier}</span>
              </div>

              <Link href="/dashboard/api-keys" className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100">
                {text.chooseModel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
