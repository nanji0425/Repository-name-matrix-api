'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, Check, ChevronDown, Copy, Download, Eye, ExternalLink, Key, Plus, Search, Shield, Trash2, X } from 'lucide-react';
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

type ImportClient =
  | 'Cherry Studio'
  | 'AionUI'
  | 'DeepChat'
  | 'Lobe Chat'
  | 'OpenCat'
  | 'Chatbox'
  | 'NextChat'
  | 'Cursor'
  | 'Continue'
  | 'Cline'
  | 'Roo Code'
  | 'Claude Code'
  | 'Codex'
  | 'VS Code';

type ImportMenu = {
  token: TokenRecord;
  top: number;
  left: number;
} | null;

const baseURL = 'https://matrixapi.online/v1';
const defaultModels = ['gpt-4o-mini', 'gpt-4.1-mini', 'deepseek-chat', 'claude-sonnet-4-5-20250929', 'gemini-2.5-pro'];

const importClients: { name: ImportClient; type: 'open' | 'copy' | 'download'; hint: string }[] = [
  { name: 'Cherry Studio', type: 'open', hint: '打开客户端导入链接' },
  { name: 'AionUI', type: 'open', hint: '打开客户端导入链接' },
  { name: 'DeepChat', type: 'open', hint: '打开客户端导入链接' },
  { name: 'Lobe Chat', type: 'open', hint: '打开网页配置页' },
  { name: 'OpenCat', type: 'copy', hint: '复制 OpenAI 配置' },
  { name: 'Chatbox', type: 'copy', hint: '复制 Chatbox 配置' },
  { name: 'NextChat', type: 'copy', hint: '复制环境变量' },
  { name: 'Cursor', type: 'copy', hint: '复制 OpenAI Base URL 配置' },
  { name: 'Continue', type: 'download', hint: '下载 config.json 片段' },
  { name: 'Cline', type: 'copy', hint: '复制 VS Code 扩展配置' },
  { name: 'Roo Code', type: 'copy', hint: '复制 Roo Code 配置' },
  { name: 'Claude Code', type: 'copy', hint: '复制环境变量' },
  { name: 'Codex', type: 'copy', hint: '复制 Codex 环境变量' },
  { name: 'VS Code', type: 'copy', hint: '复制通用 OpenAI 配置' },
];

const quickExpires = [
  { label: '永不过期', value: '' },
  { label: '1 小时', value: 'hour' },
  { label: '1 天', value: 'day' },
  { label: '1 个月', value: 'month' },
];

function maskKey(secret?: string) {
  if (!secret) return 'sk-**************';
  if (secret.length <= 16) return secret;
  return `${secret.slice(0, 6)}${'*'.repeat(12)}${secret.slice(-4)}`;
}

function formatQuota(token: TokenRecord) {
  if (token.quota == null) return '无限额度';
  const remain = Math.max(0, Number(token.quota) - Number(token.usedAmount || 0));
  return `${remain.toFixed(2)} / ${Number(token.quota).toFixed(2)}`;
}

function providerPayload(secret: string) {
  return {
    name: 'MatrixAPI',
    provider: 'openai',
    apiKey: secret,
    baseURL,
    baseUrl: baseURL,
    models: defaultModels,
  };
}

function createImportConfig(client: ImportClient, secret: string) {
  const payload = providerPayload(secret);
  const encoded = encodeURIComponent(JSON.stringify(payload));

  if (client === 'Cherry Studio') return { action: 'open', value: `cherrystudio://providers/import?data=${encoded}` };
  if (client === 'AionUI') return { action: 'open', value: `aionui://provider/import?data=${encoded}` };
  if (client === 'DeepChat') return { action: 'open', value: `deepchat://provider/import?data=${encoded}` };
  if (client === 'Lobe Chat') return { action: 'open', value: `https://chat-preview.lobehub.com/settings/llm?provider=openai&endpoint=${encodeURIComponent(baseURL)}&apikey=${encodeURIComponent(secret)}` };
  if (client === 'Continue') {
    return {
      action: 'download',
      filename: 'matrixapi-continue-config.json',
      value: JSON.stringify({
        models: [{ title: 'MatrixAPI GPT-4o Mini', provider: 'openai', model: 'gpt-4o-mini', apiBase: baseURL, apiKey: secret }],
      }, null, 2),
    };
  }
  if (client === 'NextChat') return { action: 'copy', value: `BASE_URL=${baseURL}\nOPENAI_API_KEY=${secret}` };
  if (client === 'Claude Code') return { action: 'copy', value: `export ANTHROPIC_BASE_URL=${baseURL}\nexport ANTHROPIC_AUTH_TOKEN=${secret}` };
  if (client === 'Codex') return { action: 'copy', value: `OPENAI_BASE_URL=${baseURL}\nOPENAI_API_KEY=${secret}` };
  if (client === 'Cursor') return { action: 'copy', value: `OpenAI API Key: ${secret}\nOverride OpenAI Base URL: ${baseURL}` };
  if (client === 'Cline' || client === 'Roo Code' || client === 'VS Code') {
    return { action: 'copy', value: JSON.stringify({ provider: 'openai-compatible', apiKey: secret, baseUrl: baseURL, model: 'gpt-4o-mini' }, null, 2) };
  }
  return { action: 'copy', value: JSON.stringify(payload, null, 2) };
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

function buildExpiry(kind: string) {
  if (!kind) return '';
  const date = new Date();
  if (kind === 'hour') date.setHours(date.getHours() + 1);
  if (kind === 'day') date.setDate(date.getDate() + 1);
  if (kind === 'month') date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function getMenuPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = 310;
  const left = Math.min(window.innerWidth - width - 16, Math.max(16, rect.right - width));
  const top = Math.min(window.innerHeight - 520, rect.bottom + 8);
  return { top: Math.max(16, top), left };
}

export default function ApiKeysPage() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('默认令牌');
  const [quota, setQuota] = useState('');
  const [unlimitedQuota, setUnlimitedQuota] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [importMenu, setImportMenu] = useState<ImportMenu>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [keysResponse, modelsResponse] = await Promise.all([apiKeysApi.list(), modelsApi.listActive()]);
      setTokens(Array.isArray(keysResponse.data) ? keysResponse.data : []);
      setModels(Array.isArray(modelsResponse.data) ? modelsResponse.data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '无法获取 API 密钥');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!importMenu) return;
    const close = () => setImportMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [importMenu]);

  const rows = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return tokens;
    return tokens.filter((token) => token.name.toLowerCase().includes(value) || token.secret?.toLowerCase().includes(value));
  }, [keyword, tokens]);

  const create = async () => {
    if (!name.trim()) return toast.error('请输入令牌名称');

    try {
      const payload: any = { name: name.trim() };
      if (!unlimitedQuota && quota.trim()) payload.quota = Number(quota);
      if (expiresAt) payload.expiresAt = expiresAt;
      if (selectedModels.length > 0) payload.allowedModelCodes = selectedModels;

      const response = await apiKeysApi.create(payload);
      const secret = response.data?.secret || '';
      setCreatedSecret(secret);
      setShowCreate(false);
      setName('默认令牌');
      setQuota('');
      setUnlimitedQuota(true);
      setExpiresAt('');
      setSelectedModels([]);
      toast.success(`令牌创建成功：${maskKey(secret)}`);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这个 API 密钥？删除后无法恢复。')) return;
    await apiKeysApi.delete(id);
    toast.success('密钥已删除');
    await load();
  };

  const toggle = async (id: string) => {
    await apiKeysApi.toggle(id);
    toast.success('状态已更新');
    await load();
  };

  const importToClient = async (token: TokenRecord, client: ImportClient) => {
    if (!token.secret) return toast.error('无法读取完整密钥，请创建新令牌后立即导入');
    const config = createImportConfig(client, token.secret);
    if (config.action === 'open') {
      window.open(config.value, '_blank', 'noopener,noreferrer');
      toast.success(`正在打开 ${client} 导入链接`);
    } else if (config.action === 'download') {
      downloadFile(config.filename || 'matrixapi-config.json', config.value);
      toast.success(`${client} 配置文件已下载`);
    } else {
      await copyToClipboard(config.value);
      toast.success(`${client} 配置已复制`);
    }
    setImportMenu(null);
  };

  return (
    <ConsolePage className="pb-28">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-white">令牌管理</h1>
            <ApiBaseBadge />
          </div>
          <p className="mt-3 text-sm text-slate-400">创建、限制、复制和一键导入客户端配置。建议按项目或设备分别创建令牌。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="console-input h-11 w-64 pl-9" placeholder="搜索名称或密钥" />
          </div>
          <button onClick={() => setShowCreate(true)} className="console-button-white inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加令牌
          </button>
        </div>
      </div>

      {createdSecret && (
        <section className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
          <div className="font-black">令牌已创建，请立即复制保存。完整密钥仅建议在本次操作中使用。</div>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <code className="min-w-0 flex-1 overflow-auto rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-white">{createdSecret}</code>
            <button onClick={() => copyToClipboard(createdSecret)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-slate-950">
              <Copy className="h-4 w-4" /> 复制密钥
            </button>
          </div>
        </section>
      )}

      <section className="console-card mt-7 p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[13%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className="border-b border-white/10 text-xs text-slate-500">
              <tr>
                {['名称', '状态', '剩余额度 / 总额度', '密钥', '可用模型', '创建时间', '最后使用', '过期时间', '操作'].map((item) => (
                  <th key={item} className={cn('px-5 py-4', item === '操作' && 'text-right')}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-500">正在加载...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-500">暂无令牌，点击右上角添加令牌。</td></tr>
              ) : rows.map((token) => {
                const active = token.status === 'ACTIVE';
                return (
                  <tr key={token.id} className="text-slate-300 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-bold text-white">{token.name}</td>
                    <td className="px-5 py-4"><span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>{active ? '已启用' : '已禁用'}</span></td>
                    <td className="px-5 py-4">{formatQuota(token)}</td>
                    <td className="px-5 py-4"><code className="block truncate rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-200">{maskKey(token.secret)}</code></td>
                    <td className="px-5 py-4">{token.allowedModels?.length ? `${token.allowedModels.length} 个模型` : '无限制'}</td>
                    <td className="px-5 py-4">{formatDate(token.createdAt)}</td>
                    <td className="px-5 py-4">{token.lastUsed ? formatDate(token.lastUsed) : '从未使用'}</td>
                    <td className="px-5 py-4">{token.expiresAt ? formatDate(token.expiresAt) : '永不过期'}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button onClick={() => token.secret && copyToClipboard(token.secret)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/8 hover:text-white" title="复制"><Copy className="h-4 w-4" /></button>
                        <button
                          onClick={(event) => {
                            const position = getMenuPosition(event.currentTarget);
                            setImportMenu((current) => current?.token.id === token.id ? null : { token, ...position });
                          }}
                          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-slate-300 hover:bg-white/8 hover:text-white"
                        >
                          导入 <ChevronDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => toggle(token.id)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/8 hover:text-white" title={active ? '禁用' : '启用'}><Eye className="h-4 w-4" /></button>
                        <button onClick={() => remove(token.id)} className="grid h-9 w-9 place-items-center rounded-lg text-red-400 hover:bg-red-500/10" title="删除"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {importMenu && (
        <>
          <button className="fixed inset-0 z-[80] cursor-default bg-transparent" onClick={() => setImportMenu(null)} aria-label="关闭导入菜单" />
          <div
            className="fixed z-[90] max-h-[min(520px,calc(100vh-32px))] w-[310px] overflow-y-auto rounded-xl border border-cyan-200/20 bg-[#111216] p-2 text-left shadow-2xl shadow-black/60 ring-1 ring-cyan-300/10 backdrop-blur-xl"
            style={{ top: importMenu.top, left: importMenu.left }}
          >
            {importClients.map((client) => (
              <button key={client.name} onClick={() => importToClient(importMenu.token, client.name)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 text-left transition hover:bg-cyan-300/10">
                <span>
                  <span className="block text-sm font-black text-slate-100">{client.name}</span>
                  <span className="text-xs text-slate-500">{client.hint}</span>
                </span>
                {client.type === 'open' ? <ExternalLink className="h-4 w-4 text-slate-500" /> : client.type === 'download' ? <Download className="h-4 w-4 text-slate-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
              </button>
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/55 backdrop-blur-sm">
          <div className="h-full w-full max-w-[560px] overflow-y-auto border-r border-white/10 bg-[#f7f8fa] p-6 text-slate-950 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">新建</span><h2 className="text-xl font-black">创建新的令牌</h2></div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-7 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-white"><Key className="h-4 w-4" /></span><div><div className="font-black">基本信息</div><div className="text-xs text-slate-500">设置令牌名称和有效期</div></div></div>
                <label className="block text-sm font-bold">名称 *</label>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-400" placeholder="请输入名称" />
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="block text-sm font-bold">过期时间</label>
                  <div className="flex flex-wrap gap-2">
                    {quickExpires.map((item) => <button key={item.label} onClick={() => setExpiresAt(buildExpiry(item.value))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">{item.label}</button>)}
                  </div>
                </div>
                <input type="datetime-local" value={expiresAt ? expiresAt.slice(0, 16) : ''} onChange={(event) => setExpiresAt(event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-400" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white"><Shield className="h-4 w-4" /></span><div><div className="font-black">额度设置</div><div className="text-xs text-slate-500">限制此令牌可消费金额</div></div></div>
                <label className="block text-sm font-bold">金额</label>
                <input disabled={unlimitedQuota} type="number" value={quota} onChange={(event) => setQuota(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none disabled:text-slate-400" placeholder="0.000000" />
                <label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={unlimitedQuota} onChange={(event) => setUnlimitedQuota(event.target.checked)} className="h-5 w-5" />无限额度</label>
                <p className="mt-3 text-xs text-slate-500">令牌额度只限制本令牌最大使用量，实际扣费仍受账户余额限制。</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-white"><CalendarClock className="h-4 w-4" /></span><div><div className="font-black">访问限制</div><div className="text-xs text-slate-500">设置模型访问范围</div></div></div>
                <select value="" onChange={(event) => event.target.value && setSelectedModels((current) => current.includes(event.target.value) ? current : [...current, event.target.value])} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none">
                  <option value="">请选择该令牌支持的模型，留空支持所有模型</option>
                  {models.map((model) => <option key={model.id} value={model.modelCode}>{model.name} / {model.modelCode}</option>)}
                </select>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedModels.map((model) => <button key={model} onClick={() => setSelectedModels((current) => current.filter((item) => item !== model))} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{model} x</button>)}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 flex justify-end gap-3 bg-[#f7f8fa] py-4">
              <button onClick={() => setShowCreate(false)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-black text-slate-600"><X className="h-4 w-4" />取消</button>
              <button onClick={create} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white"><Check className="h-4 w-4" />提交</button>
            </div>
          </div>
        </div>
      )}
    </ConsolePage>
  );
}
