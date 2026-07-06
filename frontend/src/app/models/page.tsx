'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, RotateCcw, Search, X } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { modelsApi } from '@/lib/api';
import { useLocaleStore } from '@/stores/localeStore';
import {
  ALL_BILLING,
  ALL_GROUP,
  ALL_PROVIDER,
  BILLING_OPTIONS,
  formatModelPrice,
  getBillingType,
  getFilterLabel,
  getModelCode,
  getModelGroups,
  getProviderName,
  GROUP_OPTIONS,
  MarketingModel,
  modelMatches,
  SUPPLIER_OPTIONS,
  UNKNOWN_PROVIDER,
} from '@/components/marketing/modelUtils';

const copy = {
  zh: {
    title: '模型广场',
    desc: '一点接入，驱动无限可能。浏览平台支持的 AI 模型，查看已按上游价格增加 40% 后的人民币展示价格。',
    search: '搜索模型 ID / 名称 / 供应商',
    filters: '筛选',
    reset: '重置',
    provider: '供应商',
    group: '分组',
    billing: '计费类型',
    loading: '模型加载中...',
    empty: '暂无匹配模型',
    available: '可用',
    inputPrice: '输入价格',
    outputPrice: '输出价格',
    getKey: '获取 API Key',
    details: '查看详情',
    modelId: '模型 ID：',
    billingMode: '计费方式',
    sampleContent: '你好',
  },
  en: {
    title: 'Model Marketplace',
    desc: 'Connect once and unlock many model capabilities. Browse supported AI models and RMB display prices with a 40% markup over upstream cost.',
    search: 'Search model ID / name / provider',
    filters: 'Filters',
    reset: 'Reset',
    provider: 'Provider',
    group: 'Group',
    billing: 'Billing Type',
    loading: 'Loading models...',
    empty: 'No matching models',
    available: 'Available',
    inputPrice: 'Input Price',
    outputPrice: 'Output Price',
    getKey: 'Get API Key',
    details: 'Details',
    modelId: 'Model ID:',
    billingMode: 'Billing',
    sampleContent: 'Hello',
  },
} as const;

const defaultFilters = { provider: ALL_PROVIDER, group: ALL_GROUP, billing: ALL_BILLING, query: '' };

export default function ModelsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [models, setModels] = useState<MarketingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MarketingModel | null>(null);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    modelsApi
      .listActive()
      .then((response) => setModels(Array.isArray(response.data) ? response.data : []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  const providers = useMemo(() => {
    const present = new Set(models.map(getProviderName));
    return SUPPLIER_OPTIONS.filter((provider) => provider === ALL_PROVIDER || provider === UNKNOWN_PROVIDER || present.has(provider));
  }, [models]);

  const visibleModels = useMemo(() => models.filter((model) => modelMatches(model, filters)), [models, filters]);

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-32">
        <h1 className="text-5xl font-black tracking-tight text-white">{text.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">{text.desc}</p>
        <div className="mt-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={filters.query}
              onChange={(event) => setFilters((value) => ({ ...value, query: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-400"
              placeholder={text.search}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 pb-24 lg:flex-row lg:gap-10">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:w-[280px] lg:shrink-0">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-5">
            <h2 className="text-lg font-black text-blue-100">{text.filters}</h2>
            <button onClick={() => setFilters(defaultFilters)} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-white">
              <RotateCcw className="h-3.5 w-3.5" />
              {text.reset}
            </button>
          </div>
          <FilterGroup title={text.provider} options={providers} value={filters.provider} onChange={(provider) => setFilters((value) => ({ ...value, provider }))} color="blue" />
          <FilterGroup title={text.group} options={GROUP_OPTIONS} value={filters.group} onChange={(group) => setFilters((value) => ({ ...value, group }))} color="green" />
          <FilterGroup title={text.billing} options={BILLING_OPTIONS} value={filters.billing} onChange={(billing) => setFilters((value) => ({ ...value, billing }))} color="orange" />
        </aside>

        <main className="min-w-0 flex-1">
          {loading ? (
            <div className="pt-10 text-lg font-bold text-slate-500">{text.loading}</div>
          ) : visibleModels.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-10 text-center font-bold text-slate-500">{text.empty}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleModels.map((model) => (
                <ModelCard key={model.id || getModelCode(model)} model={model} onSelect={() => setSelected(model)} />
              ))}
            </div>
          )}
        </main>
      </section>
      {selected && <ModelDetail model={selected} onClose={() => setSelected(null)} />}
    </MarketingLayout>
  );
}

function FilterGroup({ title, options, value, onChange, color }: { title: string; options: string[]; value: string; onChange: (value: string) => void; color: 'blue' | 'green' | 'orange' }) {
  const locale = useLocaleStore((state) => state.locale);
  const activeClass = {
    blue: 'border-blue-400/50 bg-blue-500/20 text-blue-200',
    green: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
    orange: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
  }[color];

  return (
    <div className="border-b border-white/10 py-6 last:border-b-0">
      <h3 className="mb-4 text-xl font-black text-white">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm font-black transition ${value === option ? activeClass : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white'}`}
          >
            {getFilterLabel(option, locale)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelCard({ model, onSelect }: { model: MarketingModel; onSelect: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const code = getModelCode(model);
  const billing = getBillingType(model);

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/[0.07]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-black text-white">{model.name || code}</div>
          <code className="mt-2 inline-flex rounded-lg bg-black/30 px-2 py-1 text-xs font-bold text-slate-400">{code}</code>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">{text.available}</span>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200">{getFilterLabel(getProviderName(model), locale)}</span>
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-200">{getFilterLabel(billing, locale)}</span>
        {getModelGroups(model).map((group) => (
          <span key={group} className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-300">
            {getFilterLabel(group, locale)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-4">
        <Price label={text.inputPrice} value={formatModelPrice(model.inputPrice, billing, locale)} />
        <Price label={text.outputPrice} value={formatModelPrice(model.outputPrice, billing, locale)} />
      </div>
      <div className="mt-5 flex gap-3">
        <Link href="/dashboard/api-keys" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-100">
          {text.getKey} <ArrowRight className="h-4 w-4" />
        </Link>
        <button onClick={onSelect} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-blue-300/40 hover:text-blue-300">
          {text.details}
        </button>
      </div>
    </div>
  );
}

function Price({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words font-mono text-sm font-black text-white">{value}</div>
    </div>
  );
}

function ModelDetail({ model, onClose }: { model: MarketingModel; onClose: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const code = getModelCode(model);
  const billing = getBillingType(model);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#090b12] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{model.name || code}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {text.modelId} <code className="font-mono">{code}</code>
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label={text.provider} value={getFilterLabel(getProviderName(model), locale)} />
          <Info label={text.billingMode} value={getFilterLabel(billing, locale)} />
          <Info label={text.inputPrice} value={formatModelPrice(model.inputPrice, billing, locale)} />
          <Info label={text.outputPrice} value={formatModelPrice(model.outputPrice, billing, locale)} />
        </div>
        <div className="mt-6 rounded-2xl bg-black/40 p-5 text-sm text-blue-50">
          <pre className="overflow-auto">{`curl https://matrixapi.online/v1/chat/completions \\
  -H "Authorization: Bearer $MATRIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${code}","messages":[{"role":"user","content":"${text.sampleContent}"}]}'`}</pre>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.055] p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 font-black text-white">{value}</div>
    </div>
  );
}
