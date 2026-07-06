'use client';

import { useEffect, useState } from 'react';
import { providersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Edit3, Globe, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '上游通道管理',
    add: '添加通道',
    edit: '编辑通道',
    create: '新增通道',
    channelName: '通道名称',
    baseUrl: 'Base URL',
    apiKey: 'API Key',
    keepBlank: '留空表示不修改',
    priority: '优先级',
    update: '更新通道',
    submitCreate: '创建通道',
    cancel: '取消',
    loading: '正在加载...',
    empty: '暂无上游通道，请添加第一个通道。',
    namePlaceholder: '例如：bblabu',
    keyPlaceholder: '上游 API Key',
    keyKeepPlaceholder: '留空表示不修改',
    loadFailed: '上游通道加载失败',
    required: '请填写通道名称和 Base URL',
    keyRequired: '创建通道时必须填写 API Key',
    updated: '上游通道已更新',
    created: '上游通道已创建',
    updateFailed: '上游通道更新失败',
    createFailed: '上游通道创建失败',
    deleteConfirm: '确认删除这个上游通道？删除后无法恢复。',
    deleted: '上游通道已删除',
    deleteFailed: '上游通道删除失败',
    status: { ACTIVE: '活跃', INACTIVE: '停用', ERROR: '异常' },
    table: ['名称', 'Base URL', '优先级', '状态', '创建时间', '操作'],
    editTitle: '编辑',
    deleteTitle: '删除',
  },
  en: {
    title: 'Provider Management',
    add: 'Add Provider',
    edit: 'Edit Provider',
    create: 'New Provider',
    channelName: 'Provider Name',
    baseUrl: 'Base URL',
    apiKey: 'API Key',
    keepBlank: 'leave blank to keep unchanged',
    priority: 'Priority',
    update: 'Update Provider',
    submitCreate: 'Create Provider',
    cancel: 'Cancel',
    loading: 'Loading...',
    empty: 'No upstream providers yet. Add the first provider.',
    namePlaceholder: 'Example: bblabu',
    keyPlaceholder: 'Upstream API Key',
    keyKeepPlaceholder: 'Leave blank to keep unchanged',
    loadFailed: 'Failed to load upstream providers',
    required: 'Provider name and Base URL are required',
    keyRequired: 'API Key is required when creating a provider',
    updated: 'Provider updated',
    created: 'Provider created',
    updateFailed: 'Provider update failed',
    createFailed: 'Provider creation failed',
    deleteConfirm: 'Delete this upstream provider? This cannot be undone.',
    deleted: 'Provider deleted',
    deleteFailed: 'Provider deletion failed',
    status: { ACTIVE: 'Active', INACTIVE: 'Inactive', ERROR: 'Error' },
    table: ['Name', 'Base URL', 'Priority', 'Status', 'Created', 'Actions'],
    editTitle: 'Edit',
    deleteTitle: 'Delete',
  },
} as const;

export default function AdminProvidersPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', priority: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await providersApi.list();
      setProviders(data.data || data.items || data || []);
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

  const resetForm = () => {
    setForm({ name: '', baseUrl: '', apiKey: '', priority: 0 });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (provider: any) => {
    setForm({
      name: provider.name || '',
      baseUrl: provider.baseUrl || '',
      apiKey: '',
      priority: provider.priority ?? 0,
    });
    setEditingId(provider.id || provider._id);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast.error(text.required);
      return;
    }

    try {
      if (editingId) {
        const updateData: any = { name: form.name, baseUrl: form.baseUrl, priority: form.priority };
        if (form.apiKey.trim()) updateData.apiKey = form.apiKey;
        await providersApi.update(editingId, updateData);
        toast.success(text.updated);
      } else {
        if (!form.apiKey.trim()) {
          toast.error(text.keyRequired);
          return;
        }
        await providersApi.create(form);
        toast.success(text.created);
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? text.updateFailed : text.createFailed));
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return;
    try {
      await providersApi.delete(id);
      toast.success(text.deleted);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.deleteFailed);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-500',
      ERROR: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  const statusLabel = (status: string) => text.status[(status || 'ACTIVE') as keyof typeof text.status] || status || text.status.ACTIVE;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> {text.add}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950 dark:text-white">{editingId ? text.edit : text.create}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.channelName}</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.namePlaceholder} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.baseUrl}</label>
              <input value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                {text.apiKey} {editingId && <span className="font-normal text-gray-400">({text.keepBlank})</span>}
              </label>
              <input type="password" value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={editingId ? text.keyKeepPlaceholder : text.keyPlaceholder} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.priority}</label>
              <input type="number" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: parseInt(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="0" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={submitForm} className="btn-primary">{editingId ? text.update : text.submitCreate}</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">{text.cancel}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : providers.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <Globe className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 2 || index === 5 ? 'text-center' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {providers.map((provider: any) => {
                  const id = provider.id || provider._id;
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm font-medium text-slate-950 dark:text-white">{provider.name}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 font-mono text-sm text-gray-600 dark:text-slate-300">{provider.baseUrl}</td>
                      <td className="px-4 py-3 text-center text-sm"><span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-white/10">{provider.priority ?? 0}</span></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(provider.status)}`}>{statusLabel(provider.status || 'ACTIVE')}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{provider.createdAt ? formatDate(provider.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(provider)} className="rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10" title={text.editTitle}>
                            <Edit3 className="h-4 w-4 text-gray-400" />
                          </button>
                          <button onClick={() => deleteProvider(id)} className="rounded p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10" title={text.deleteTitle}>
                            <Trash2 className="h-4 w-4 text-red-400" />
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
      )}
    </div>
  );
}
