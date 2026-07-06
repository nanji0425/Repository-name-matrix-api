'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Eye, Key, Plus, Trash2, X } from 'lucide-react';
import { ApiBaseBadge, ConsolePage } from '@/components/console/ConsoleShell';
import { apiKeysApi, modelsApi } from '@/lib/api';
import { copyToClipboard, formatDate } from '@/lib/utils';

type TokenRecord = {
  id: string;
  name: string;
  secret?: string;
  status: 'ACTIVE' | 'DISABLED' | string;
  quota?: number | null;
  usedAmount?: number;
  requestCount?: number;
  expiresAt?: string | null;
  lastUsed?: string | null;
  allowedModels?: string[] | null;
  createdAt: string;
};

type ModelOption = {
  id: string;
  modelCode: string;
  name: string;
};

function maskKey(secret?: string) {
  if (!secret) return 'sk-**************';
  if (secret.length <= 16) return secret;
  return `${secret.slice(0, 6)}${'*'.repeat(12)}${secret.slice(-4)}`;
}

export default function ApiKeysPage() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('聊天分组');
  const [quota, setQuota] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [keysResponse, modelsResponse] = await Promise.all([apiKeysApi.list(), modelsApi.listActive()]);
      setTokens(Array.isArray(keysResponse.data) ? keysResponse.data : []);
      setModels(Array.isArray(modelsResponse.data) ? modelsResponse.data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '无法获取 API Key');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) {
      toast.error('请输入密钥名称');
      return;
    }

    try {
      const payload: any = { name: name.trim() };
      if (quota.trim()) payload.quota = Number(quota);
      if (selectedModels.length > 0) payload.allowedModelCodes = selectedModels;

      const response = await apiKeysApi.create(payload);
      const secret = response.data?.secret || '';

      setCreatedSecret(secret);
      setShowCreate(false);
      setName('聊天分组');
      setQuota('');
      setSelectedModels([]);

      toast.success(`密钥创建成功：${maskKey(secret)}`);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这个 API Key？删除后无法恢复。')) return;
    await apiKeysApi.delete(id);
    toast.success('密钥已删除');
    await load();
  };

  const toggle = async (id: string) => {
    await apiKeysApi.toggle(id);
    toast.success('状态已更新');
    await load();
  };

  const rows = useMemo(() => tokens, [tokens]);

  return (
    <ConsolePage className="pb-28">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-white">API Key</h1>
          <ApiBaseBadge />
        </div>
        <button onClick={() => setShowCreate(true)} className="console-button-white inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          创建新密钥
        </button>
      </div>

      {createdSecret && (
        <div className="fixed right-8 top-24 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          密钥创建成功：{maskKey(createdSecret)}
        </div>
      )}

      <section className="console-card mt-7 min-h-[200px] p-8">
        {loading ? (
          <div className="py-16 text-center text-slate-500">正在加载...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Key className="mx-auto mb-4 h-12 w-12" />
            暂无密钥，点击右上角创建新密钥。
          </div>
        ) : (
          <div className="space-y-8">
            {rows.map((token, index) => {
              const active = token.status === 'ACTIVE';
              return (
                <div key={token.id} className="flex items-start justify-between gap-8">
                  <div className="min-w-0">
                    <div className="text-lg font-black text-white">{index + 1}</div>
                    <code className="mt-3 block font-mono text-sm text-slate-400">{maskKey(token.secret)}</code>
                    <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-500">
                      <span>
                        分组 <b className="ml-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">{token.name || '聊天分组'}</b>
                      </span>
                      <span>
                        状态 <b className="ml-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">{active ? '启用' : '停用'}</b>
                      </span>
                      <span>
                        剩余额度/总额度 <b className="font-medium text-slate-300">{token.quota == null ? '无限 / 无限' : `${Math.max(0, Number(token.quota) - Number(token.usedAmount || 0)).toFixed(2)} / ${Number(token.quota).toFixed(2)}`}</b>
                      </span>
                      <span>
                        过期时间 <b className="font-medium text-slate-300">{token.expiresAt ? formatDate(token.expiresAt) : '永不过期'}</b>
                      </span>
                      <span>
                        创建时间 <b className="font-medium text-slate-300">{formatDate(token.createdAt)}</b>
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                      允许模型 <span className="text-slate-300">{token.allowedModels?.length ? token.allowedModels.join('、') : '全部模型'}</span>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                      最近使用 <span className="text-slate-300">{token.lastUsed ? formatDate(token.lastUsed) : '从未使用'}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 pt-8 text-slate-300">
                    <button
                      title="复制"
                      onClick={() => {
                        if (token.secret) copyToClipboard(token.secret);
                        toast.success('已复制');
                      }}
                      className="transition hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button title={active ? '停用' : '启用'} onClick={() => toggle(token.id)} className="transition hover:text-white">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button title="删除" onClick={() => remove(token.id)} className="text-red-400 transition hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#151518] p-7 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black">创建新密钥</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">分组名称</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="console-input w-full" placeholder="聊天分组" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">额度限制（可选）</span>
                <input type="number" value={quota} onChange={(event) => setQuota(event.target.value)} className="console-input w-full" placeholder="留空表示无限" />
              </label>
              <div>
                <div className="mb-2 block text-sm font-bold text-slate-300">可调用模型</div>
                <div className="grid max-h-[280px] gap-3 overflow-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-2">
                  {models.map((model) => (
                    <label key={model.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.modelCode)}
                        onChange={(event) => {
                          setSelectedModels((current) =>
                            event.target.checked ? [...current, model.modelCode] : current.filter((item) => item !== model.modelCode),
                          );
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-black"
                      />
                      <div>
                        <div className="font-bold text-white">{model.name}</div>
                        <div className="text-xs text-slate-500">{model.modelCode}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={create} className="mt-6 h-11 w-full rounded-full bg-white text-sm font-black text-slate-950">
              创建密钥
            </button>
          </div>
        </div>
      )}
    </ConsolePage>
  );
}
