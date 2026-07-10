'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronDown, Copy, ExternalLink, Plus, Search, ShieldAlert, Trash2, X } from 'lucide-react';
import { ApiBaseBadge, ConsolePage } from '@/components/console/ConsoleShell';
import { apiKeysApi, modelsApi } from '@/lib/api';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type TokenRecord = {
  id: string;
  name: string;
  secret?: string;
  status: 'ACTIVE' | 'DISABLED' | string;
  quota?: number | null;
  usedAmount?: number;
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

const actionLinks = [
  { name: 'Cherry Studio', type: 'open' as const },
  { name: 'Lobe Chat', type: 'open' as const },
  { name: 'Chatbox', type: 'copy' as const },
  { name: 'NextChat', type: 'copy' as const },
  { name: 'Continue', type: 'download' as const },
  { name: 'Codex', type: 'copy' as const },
];

function maskKey(secret?: string) {
  if (!secret) return 'sk-**************';
  if (secret.length <= 16) return secret;
  return `${secret.slice(0, 6)}${'*'.repeat(12)}${secret.slice(-4)}`;
}

function buildExpiry(kind: string) {
  if (!kind) return '';
  const date = new Date();
  if (kind === 'hour') date.setHours(date.getHours() + 1);
  if (kind === 'day') date.setDate(date.getDate() + 1);
  if (kind === 'month') date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ApiKeysPage() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [secretKeyword, setSecretKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createdSecret, setCreatedSecret] = useState('');
  const [name, setName] = useState('默认密钥');
  const [quota, setQuota] = useState('');
  const [unlimitedQuota, setUnlimitedQuota] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [keysResponse, modelsResponse] = await Promise.all([apiKeysApi.list(), modelsApi.listActive()]);
      setTokens(Array.isArray(keysResponse.data) ? keysResponse.data : []);
      setModels(Array.isArray(modelsResponse.data) ? modelsResponse.data : []);
    } catch {
      setTokens([]);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const nameValue = keyword.trim().toLowerCase();
    const secretValue = secretKeyword.trim().toLowerCase();
    return tokens.filter((token) => {
      const matchName = !nameValue || token.name.toLowerCase().includes(nameValue);
      const matchSecret = !secretValue || token.secret?.toLowerCase().includes(secretValue);
      const matchStatus = !status || token.status === status;
      return matchName && matchSecret && matchStatus;
    });
  }, [keyword, secretKeyword, status, tokens]);

  const create = async () => {
    if (!name.trim()) return toast.error('请输入密钥名称');
    try {
      const payload: any = { name: name.trim() };
      if (!unlimitedQuota && quota.trim()) payload.quota = Number(quota);
      if (expiresAt) payload.expiresAt = expiresAt;
      if (selectedModels.length > 0) payload.allowedModelCodes = selectedModels;
      const response = await apiKeysApi.create(payload);
      const secret = response.data?.secret || '';
      setCreatedSecret(secret);
      setShowCreate(false);
      setName('默认密钥');
      setQuota('');
      setUnlimitedQuota(true);
      setExpiresAt('');
      setSelectedModels([]);
      toast.success('密钥已创建');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败');
    }
  };

  const toggle = async (id: string) => {
    await apiKeysApi.toggle(id);
    toast.success('状态已更新');
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这个 API 密钥？删除后无法恢复。')) return;
    await apiKeysApi.delete(id);
    toast.success('密钥已删除');
    await load();
  };

  const importToClient = async (token: TokenRecord, client: typeof actionLinks[number]) => {
    if (!token.secret) return toast.error('当前无法读取完整密钥，请先创建新密钥。');
    if (client.type === 'open') {
      toast.success(`${client.name} 已打开`);
      window.open('https://chat.openai.com', '_blank', 'noopener,noreferrer');
      return;
    }
    if (client.type === 'download') {
      downloadFile('matrixapi-config.json', JSON.stringify({ apiKey: token.secret, baseURL: 'https://api.bblabu.cn' }, null, 2));
      toast.success('配置已下载');
      return;
    }
    await copyToClipboard(`OPENAI_BASE_URL=https://api.bblabu.cn\nOPENAI_API_KEY=${token.secret}`);
    toast.success('配置已复制');
  };

  return (
    <ConsolePage className="pb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#231f27]">API 密钥</h1>
            <ApiBaseBadge />
          </div>
          <p className="mt-2 text-sm text-[#9b8292]">按名称筛选并管理密钥，支持复制、开关和导入。</p>
        </div>

        <button onClick={() => setShowCreate(true)} className="console-button-white inline-flex items-center gap-2 self-start">
          <Plus className="h-4 w-4" />
          创建 API 密钥
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-[#f1d6e2] bg-white/80 p-4">
        <label className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c39aac]" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="console-input w-full pl-10" placeholder="按名称筛选..." />
        </label>
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c39aac]" />
          <input value={secretKeyword} onChange={(event) => setSecretKeyword(event.target.value)} className="console-input w-full pl-10" placeholder="按 API 密钥筛选..." />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="console-input w-[140px]">
          <option value="">状态</option>
          <option value="ACTIVE">已启用</option>
          <option value="DISABLED">已禁用</option>
        </select>
        <button className="console-button-white inline-flex items-center gap-2" onClick={load}>
          <ShieldAlert className="h-4 w-4" />
          查看
        </button>
      </div>

      {createdSecret && (
        <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
          <div className="font-bold">密钥已创建，请立即复制保存。完整密钥只会展示一次。</div>
          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center">
            <code className="min-w-0 flex-1 overflow-auto rounded-2xl bg-black/80 px-3 py-2 font-mono text-xs text-white">{createdSecret}</code>
            <button onClick={() => copyToClipboard(createdSecret)} className="console-button-white inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              复制密钥
            </button>
          </div>
        </div>
      )}

      <div className="console-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1220px] w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-[#fff8fb] text-[#8f7384]">
              <tr>
                {['名称', '状态', 'API 密钥', '额度', '分组', '模型', 'IP 限制', '创建时间', '操作'].map((item) => (
                  <th key={item} className="px-5 py-4 font-medium">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-[#9b8292]">正在加载...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-[#9b8292]">暂无 API 密钥</td></tr>
              ) : rows.map((token) => {
                const active = token.status === 'ACTIVE';
                const menuOpen = openMenu === token.id;
                return (
                  <tr key={token.id} className="border-t border-[#f6e4ec] text-[#3e3140]">
                    <td className="px-5 py-4 font-bold text-[#231f27]">{token.name}</td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')}>
                        {active ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <code className="block truncate rounded-full bg-[#fff7fb] px-3 py-2 font-mono text-xs">{maskKey(token.secret)}</code>
                    </td>
                    <td className="px-5 py-4">{token.quota == null ? '无限制' : `${Math.max(0, Number(token.quota) - Number(token.usedAmount || 0)).toFixed(2)} / ${Number(token.quota).toFixed(2)}`}</td>
                    <td className="px-5 py-4">{token.allowedModels?.length ? 'Claude' : 'default'}</td>
                    <td className="px-5 py-4">{token.allowedModels?.length ? `${token.allowedModels.length} model(s)` : '无限制'}</td>
                    <td className="px-5 py-4">无限制</td>
                    <td className="px-5 py-4">{formatDate(token.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="relative flex items-center justify-end gap-2">
                        <button onClick={() => token.secret && copyToClipboard(token.secret)} className="console-icon-button h-8 w-8" title="复制密钥"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => setOpenMenu(menuOpen ? null : token.id)} className="console-button-white inline-flex h-8 items-center gap-1 px-3 text-xs">
                          CC Switch <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-2xl border border-[#f1d6e2] bg-white p-2 shadow-[0_20px_40px_rgba(170,117,143,0.14)]">
                            {actionLinks.map((item) => (
                              <button key={item.name} onClick={() => importToClient(token, item)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#3e3140] hover:bg-[#fff3f8]">
                                <span className="inline-flex items-center gap-2">
                                  {item.type === 'open' ? <ExternalLink className="h-4 w-4 text-[#d36b9a]" /> : item.type === 'download' ? <Copy className="h-4 w-4 text-[#d36b9a]" /> : <Copy className="h-4 w-4 text-[#d36b9a]" />}
                                  {item.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={() => toggle(token.id)} className="console-icon-button h-8 w-8" title={active ? '禁用' : '启用'}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(token.id)} className="console-icon-button h-8 w-8 text-rose-500" title="删除">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm">
          <div className="ml-auto h-full w-full max-w-[560px] overflow-y-auto border-l border-[#f1d6e2] bg-[#fffafc] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#d36b9a]">新建</div>
                <h2 className="text-2xl font-bold text-[#231f27]">创建 API 密钥</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="console-icon-button">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-[#f1d6e2] bg-white p-5">
                <label className="block text-sm font-medium text-[#6b5363]">名称 *</label>
                <input value={name} onChange={(event) => setName(event.target.value)} className="console-input mt-2 w-full" placeholder="请输入名称" />

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: '永不过期', value: '' },
                    { label: '1 小时', value: 'hour' },
                    { label: '1 天', value: 'day' },
                    { label: '1 个月', value: 'month' },
                  ].map((item) => (
                    <button key={item.label} onClick={() => setExpiresAt(buildExpiry(item.value))} className="console-button-white h-9 px-3 text-xs">
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#6b5363]">额度设置</label>
                  <input disabled={unlimitedQuota} type="number" value={quota} onChange={(event) => setQuota(event.target.value)} className="console-input mt-2 w-full disabled:opacity-50" placeholder="0.00" />
                  <label className="mt-3 flex items-center gap-2 text-sm text-[#6b5363]">
                    <input type="checkbox" checked={unlimitedQuota} onChange={(event) => setUnlimitedQuota(event.target.checked)} />
                    无限额度
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#6b5363]">模型范围</label>
                  <select value="" onChange={(event) => event.target.value && setSelectedModels((current) => current.includes(event.target.value) ? current : [...current, event.target.value])} className="console-input mt-2 w-full">
                    <option value="">请选择模型</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.modelCode}>
                        {model.name} / {model.modelCode}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedModels.map((model) => (
                      <button key={model} onClick={() => setSelectedModels((current) => current.filter((item) => item !== model))} className="console-button-white h-8 px-3 text-xs">
                        {model} ×
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 rounded-[24px] border border-[#f1d6e2] bg-white/90 p-4">
                <button onClick={() => setShowCreate(false)} className="console-button-white">取消</button>
                <button onClick={create} className="console-button-white bg-gradient-to-r from-[#f472b6] to-[#ec4899] text-white">提交</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConsolePage>
  );
}
