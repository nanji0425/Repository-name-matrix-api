'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, Check, ChevronDown, Copy, Download, Eye, ExternalLink, Key, Plus, Search, Shield, Trash2, X } from 'lucide-react';
import { ApiBaseBadge, ConsolePage } from '@/components/console/ConsoleShell';
import { apiKeysApi, modelsApi } from '@/lib/api';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/stores/localeStore';

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

const copy = {
  zh: {
    title: '令牌管理',
    desc: '创建、限制、复制和一键导入客户端配置。建议按项目或设备分别创建令牌。',
    search: '搜索名称或密钥',
    add: '添加令牌',
    createdTitle: '令牌已创建，请立即复制保存。完整密钥仅建议在本次操作中使用。',
    copySecret: '复制密钥',
    loading: '正在加载...',
    empty: '暂无令牌，点击右上角添加令牌。',
    active: '已启用',
    disabled: '已禁用',
    unlimited: '无限额度',
    unrestricted: '无限制',
    neverUsed: '从未使用',
    neverExpires: '永不过期',
    import: '导入',
    closeImport: '关闭导入菜单',
    createTitle: '创建新的令牌',
    new: '新建',
    basic: '基本信息',
    basicDesc: '设置令牌名称和有效期',
    name: '名称 *',
    namePlaceholder: '请输入名称',
    expiry: '过期时间',
    quota: '额度设置',
    quotaDesc: '限制此令牌可消费金额',
    amount: '金额',
    unlimitedQuota: '无限额度',
    quotaHelp: '令牌额度只限制本令牌最大使用量，实际扣费仍受账户余额限制。',
    access: '访问限制',
    accessDesc: '设置模型访问范围',
    modelPlaceholder: '请选择该令牌支持的模型，留空支持所有模型',
    cancel: '取消',
    submit: '提交',
    loadFailed: '无法获取 API 密钥',
    nameRequired: '请输入令牌名称',
    createSuccess: '令牌创建成功',
    createFailed: '创建失败',
    deleteConfirm: '确认删除这个 API 密钥？删除后无法恢复。',
    deleted: '密钥已删除',
    statusUpdated: '状态已更新',
    missingSecret: '无法读取完整密钥，请创建新令牌后立即导入',
    openingImport: '正在打开导入链接',
    configDownloaded: '配置文件已下载',
    configCopied: '配置已复制',
    copy: '复制',
    disable: '禁用',
    enable: '启用',
    delete: '删除',
    modelUnit: '个模型',
    table: ['名称', '状态', '剩余额度 / 总额度', '密钥', '可用模型', '创建时间', '最后使用', '过期时间', '操作'],
    expireOptions: [
      { label: '永不过期', value: '' },
      { label: '1 小时', value: 'hour' },
      { label: '1 天', value: 'day' },
      { label: '1 个月', value: 'month' },
    ],
    importHints: {
      openClient: '打开客户端导入链接',
      openWeb: '打开网页配置页',
      copyOpenAI: '复制 OpenAI 配置',
      copyChatbox: '复制 Chatbox 配置',
      copyEnv: '复制环境变量',
      copyBaseUrl: '复制 OpenAI Base URL 配置',
      downloadContinue: '下载 config.json 片段',
      copyExtension: '复制 VS Code 扩展配置',
      copyRoo: '复制 Roo Code 配置',
      copyCodex: '复制 Codex 环境变量',
      copyGeneric: '复制通用 OpenAI 配置',
    },
  },
  en: {
    title: 'Token Management',
    desc: 'Create, limit, copy, and one-click import client configuration. Use separate tokens for each project or device.',
    search: 'Search name or key',
    add: 'Add Token',
    createdTitle: 'Token created. Copy and store it now. The full key is only intended for this operation.',
    copySecret: 'Copy Secret',
    loading: 'Loading...',
    empty: 'No tokens yet. Click Add Token in the top right.',
    active: 'Enabled',
    disabled: 'Disabled',
    unlimited: 'Unlimited quota',
    unrestricted: 'Unrestricted',
    neverUsed: 'Never used',
    neverExpires: 'Never expires',
    import: 'Import',
    closeImport: 'Close import menu',
    createTitle: 'Create New Token',
    new: 'New',
    basic: 'Basic Info',
    basicDesc: 'Set token name and expiration',
    name: 'Name *',
    namePlaceholder: 'Enter name',
    expiry: 'Expiration',
    quota: 'Quota Settings',
    quotaDesc: 'Limit the amount this token can consume',
    amount: 'Amount',
    unlimitedQuota: 'Unlimited quota',
    quotaHelp: 'Token quota limits this token only. Actual billing is still constrained by account balance.',
    access: 'Access Limits',
    accessDesc: 'Set model access scope',
    modelPlaceholder: 'Select models supported by this token, or leave empty for all models',
    cancel: 'Cancel',
    submit: 'Submit',
    loadFailed: 'Unable to load API keys',
    nameRequired: 'Enter a token name',
    createSuccess: 'Token created',
    createFailed: 'Creation failed',
    deleteConfirm: 'Delete this API key? This cannot be undone.',
    deleted: 'Key deleted',
    statusUpdated: 'Status updated',
    missingSecret: 'Full key is unavailable. Create a new token and import it immediately.',
    openingImport: 'Opening import link',
    configDownloaded: 'Configuration file downloaded',
    configCopied: 'Configuration copied',
    copy: 'Copy',
    disable: 'Disable',
    enable: 'Enable',
    delete: 'Delete',
    modelUnit: 'models',
    table: ['Name', 'Status', 'Remaining / Total Quota', 'Key', 'Models', 'Created', 'Last Used', 'Expires', 'Actions'],
    expireOptions: [
      { label: 'Never expires', value: '' },
      { label: '1 hour', value: 'hour' },
      { label: '1 day', value: 'day' },
      { label: '1 month', value: 'month' },
    ],
    importHints: {
      openClient: 'Open client import link',
      openWeb: 'Open web settings page',
      copyOpenAI: 'Copy OpenAI config',
      copyChatbox: 'Copy Chatbox config',
      copyEnv: 'Copy environment variables',
      copyBaseUrl: 'Copy OpenAI Base URL config',
      downloadContinue: 'Download config.json snippet',
      copyExtension: 'Copy VS Code extension config',
      copyRoo: 'Copy Roo Code config',
      copyCodex: 'Copy Codex environment variables',
      copyGeneric: 'Copy generic OpenAI config',
    },
  },
} as const;

function maskKey(secret?: string) {
  if (!secret) return 'sk-**************';
  if (secret.length <= 16) return secret;
  return `${secret.slice(0, 6)}${'*'.repeat(12)}${secret.slice(-4)}`;
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
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const importClients = useMemo(() => ([
    { name: 'Cherry Studio' as const, type: 'open' as const, hint: text.importHints.openClient },
    { name: 'AionUI' as const, type: 'open' as const, hint: text.importHints.openClient },
    { name: 'DeepChat' as const, type: 'open' as const, hint: text.importHints.openClient },
    { name: 'Lobe Chat' as const, type: 'open' as const, hint: text.importHints.openWeb },
    { name: 'OpenCat' as const, type: 'copy' as const, hint: text.importHints.copyOpenAI },
    { name: 'Chatbox' as const, type: 'copy' as const, hint: text.importHints.copyChatbox },
    { name: 'NextChat' as const, type: 'copy' as const, hint: text.importHints.copyEnv },
    { name: 'Cursor' as const, type: 'copy' as const, hint: text.importHints.copyBaseUrl },
    { name: 'Continue' as const, type: 'download' as const, hint: text.importHints.downloadContinue },
    { name: 'Cline' as const, type: 'copy' as const, hint: text.importHints.copyExtension },
    { name: 'Roo Code' as const, type: 'copy' as const, hint: text.importHints.copyRoo },
    { name: 'Claude Code' as const, type: 'copy' as const, hint: text.importHints.copyEnv },
    { name: 'Codex' as const, type: 'copy' as const, hint: text.importHints.copyCodex },
    { name: 'VS Code' as const, type: 'copy' as const, hint: text.importHints.copyGeneric },
  ]), [text]);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState(locale === 'zh' ? '默认令牌' : 'Default token');
  const [quota, setQuota] = useState('');
  const [unlimitedQuota, setUnlimitedQuota] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [importMenu, setImportMenu] = useState<ImportMenu>(null);

  useEffect(() => {
    setName((current) => {
      if (current === '默认令牌' || current === 'Default token') return locale === 'zh' ? '默认令牌' : 'Default token';
      return current;
    });
  }, [locale]);

  const formatQuota = (token: TokenRecord) => {
    if (token.quota == null) return text.unlimited;
    const remain = Math.max(0, Number(token.quota) - Number(token.usedAmount || 0));
    return `${remain.toFixed(2)} / ${Number(token.quota).toFixed(2)}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [keysResponse, modelsResponse] = await Promise.all([apiKeysApi.list(), modelsApi.listActive()]);
      setTokens(Array.isArray(keysResponse.data) ? keysResponse.data : []);
      setModels(Array.isArray(modelsResponse.data) ? modelsResponse.data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!name.trim()) return toast.error(text.nameRequired);

    try {
      const payload: any = { name: name.trim() };
      if (!unlimitedQuota && quota.trim()) payload.quota = Number(quota);
      if (expiresAt) payload.expiresAt = expiresAt;
      if (selectedModels.length > 0) payload.allowedModelCodes = selectedModels;

      const response = await apiKeysApi.create(payload);
      const secret = response.data?.secret || '';
      setCreatedSecret(secret);
      setShowCreate(false);
      setName(locale === 'zh' ? '默认令牌' : 'Default token');
      setQuota('');
      setUnlimitedQuota(true);
      setExpiresAt('');
      setSelectedModels([]);
      toast.success(`${text.createSuccess}: ${maskKey(secret)}`);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.createFailed);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return;
    await apiKeysApi.delete(id);
    toast.success(text.deleted);
    await load();
  };

  const toggle = async (id: string) => {
    await apiKeysApi.toggle(id);
    toast.success(text.statusUpdated);
    await load();
  };

  const importToClient = async (token: TokenRecord, client: ImportClient) => {
    if (!token.secret) return toast.error(text.missingSecret);
    const config = createImportConfig(client, token.secret);
    if (config.action === 'open') {
      window.open(config.value, '_blank', 'noopener,noreferrer');
      toast.success(`${text.openingImport}: ${client}`);
    } else if (config.action === 'download') {
      downloadFile(config.filename || 'matrixapi-config.json', config.value);
      toast.success(`${client} ${text.configDownloaded}`);
    } else {
      await copyToClipboard(config.value);
      toast.success(`${client} ${text.configCopied}`);
    }
    setImportMenu(null);
  };

  return (
    <ConsolePage className="pb-28">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
            <ApiBaseBadge />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="console-input h-11 w-64 pl-9" placeholder={text.search} />
          </div>
          <button onClick={() => setShowCreate(true)} className="console-button-white inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {text.add}
          </button>
        </div>
      </div>

      {createdSecret && (
        <section className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-sm text-emerald-900 dark:text-emerald-100">
          <div className="font-black">{text.createdTitle}</div>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <code className="min-w-0 flex-1 overflow-auto rounded-lg bg-black/70 px-3 py-2 font-mono text-xs text-white">{createdSecret}</code>
            <button onClick={() => copyToClipboard(createdSecret)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-slate-950">
              <Copy className="h-4 w-4" /> {text.copySecret}
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
            <thead className="border-b border-cyan-200/20 text-xs text-slate-600 dark:text-slate-500">
              <tr>
                {text.table.map((item, index) => (
                  <th key={item} className={cn('px-5 py-4', index === text.table.length - 1 && 'text-right')}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-200/10">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-500">{text.loading}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-500">{text.empty}</td></tr>
              ) : rows.map((token) => {
                const active = token.status === 'ACTIVE';
                return (
                  <tr key={token.id} className="text-slate-700 transition hover:bg-cyan-500/5 dark:text-slate-300">
                    <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">{token.name}</td>
                    <td className="px-5 py-4"><span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300')}>{active ? text.active : text.disabled}</span></td>
                    <td className="px-5 py-4">{formatQuota(token)}</td>
                    <td className="px-5 py-4"><code className="block truncate rounded-lg bg-white/70 px-2.5 py-1 font-mono text-xs text-slate-700 dark:bg-white/5 dark:text-slate-200">{maskKey(token.secret)}</code></td>
                    <td className="px-5 py-4">{token.allowedModels?.length ? `${token.allowedModels.length} ${text.modelUnit}` : text.unrestricted}</td>
                    <td className="px-5 py-4">{formatDate(token.createdAt)}</td>
                    <td className="px-5 py-4">{token.lastUsed ? formatDate(token.lastUsed) : text.neverUsed}</td>
                    <td className="px-5 py-4">{token.expiresAt ? formatDate(token.expiresAt) : text.neverExpires}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button onClick={() => token.secret && copyToClipboard(token.secret)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-cyan-500/10 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" title={text.copy}><Copy className="h-4 w-4" /></button>
                        <button
                          onClick={(event) => {
                            const position = getMenuPosition(event.currentTarget);
                            setImportMenu((current) => current?.token.id === token.id ? null : { token, ...position });
                          }}
                          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-slate-600 hover:bg-cyan-500/10 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                        >
                          {text.import} <ChevronDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => toggle(token.id)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-cyan-500/10 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" title={active ? text.disable : text.enable}><Eye className="h-4 w-4" /></button>
                        <button onClick={() => remove(token.id)} className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-500/10 dark:text-red-400" title={text.delete}><Trash2 className="h-4 w-4" /></button>
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
          <button className="fixed inset-0 z-[80] cursor-default bg-transparent" onClick={() => setImportMenu(null)} aria-label={text.closeImport} />
          <div
            className="fixed z-[90] max-h-[min(520px,calc(100vh-32px))] w-[310px] overflow-y-auto rounded-xl border border-cyan-200/30 bg-white/95 p-2 text-left shadow-2xl shadow-slate-950/20 ring-1 ring-cyan-300/20 backdrop-blur-xl dark:border-cyan-200/20 dark:bg-[#111216]/95 dark:shadow-black/60"
            style={{ top: importMenu.top, left: importMenu.left }}
          >
            {importClients.map((client) => (
              <button key={client.name} onClick={() => importToClient(importMenu.token, client.name)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 text-left transition hover:bg-cyan-300/10">
                <span>
                  <span className="block text-sm font-black text-slate-950 dark:text-slate-100">{client.name}</span>
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
          <div className="h-full w-full max-w-[560px] overflow-y-auto border-r border-cyan-200/20 bg-[#f7f8fa] p-6 text-slate-950 shadow-2xl dark:bg-[#0b1020] dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{text.new}</span><h2 className="text-xl font-black">{text.createTitle}</h2></div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-7 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-white"><Key className="h-4 w-4" /></span><div><div className="font-black">{text.basic}</div><div className="text-xs text-slate-500">{text.basicDesc}</div></div></div>
                <label className="block text-sm font-bold">{text.name}</label>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.namePlaceholder} />
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="block text-sm font-bold">{text.expiry}</label>
                  <div className="flex flex-wrap gap-2">
                    {text.expireOptions.map((item) => <button key={item.label} onClick={() => setExpiresAt(buildExpiry(item.value))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:bg-white/10 dark:text-cyan-200 dark:hover:bg-white/15">{item.label}</button>)}
                  </div>
                </div>
                <input type="datetime-local" value={expiresAt ? expiresAt.slice(0, 16) : ''} onChange={(event) => setExpiresAt(event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white"><Shield className="h-4 w-4" /></span><div><div className="font-black">{text.quota}</div><div className="text-xs text-slate-500">{text.quotaDesc}</div></div></div>
                <label className="block text-sm font-bold">{text.amount}</label>
                <input disabled={unlimitedQuota} type="number" value={quota} onChange={(event) => setQuota(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-950 outline-none disabled:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="0.000000" />
                <label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={unlimitedQuota} onChange={(event) => setUnlimitedQuota(event.target.checked)} className="h-5 w-5" />{text.unlimitedQuota}</label>
                <p className="mt-3 text-xs text-slate-500">{text.quotaHelp}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-white"><CalendarClock className="h-4 w-4" /></span><div><div className="font-black">{text.access}</div><div className="text-xs text-slate-500">{text.accessDesc}</div></div></div>
                <select value="" onChange={(event) => event.target.value && setSelectedModels((current) => current.includes(event.target.value) ? current : [...current, event.target.value])} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-950 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <option value="">{text.modelPlaceholder}</option>
                  {models.map((model) => <option key={model.id} value={model.modelCode}>{model.name} / {model.modelCode}</option>)}
                </select>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedModels.map((model) => <button key={model} onClick={() => setSelectedModels((current) => current.filter((item) => item !== model))} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{model} x</button>)}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 flex justify-end gap-3 bg-[#f7f8fa] py-4 dark:bg-[#0b1020]">
              <button onClick={() => setShowCreate(false)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-black text-slate-600 dark:bg-white/10 dark:text-slate-200"><X className="h-4 w-4" />{text.cancel}</button>
              <button onClick={create} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white"><Check className="h-4 w-4" />{text.submit}</button>
            </div>
          </div>
        </div>
      )}
    </ConsolePage>
  );
}
