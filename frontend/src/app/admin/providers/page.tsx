'use client';

import { useEffect, useState } from 'react';
import { providersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Globe, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', priority: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await providersApi.list();
      setProviders(data.data || data || []);
    } catch {
      toast.error('上游通道加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
    if (!form.name.trim() || !form.baseUrl.trim()) return toast.error('请填写通道名称和 Base URL');
    try {
      if (editingId) {
        const updateData: any = { name: form.name, baseUrl: form.baseUrl, priority: form.priority };
        if (form.apiKey.trim()) updateData.apiKey = form.apiKey;
        await providersApi.update(editingId, updateData);
        toast.success('上游通道已更新');
      } else {
        await providersApi.create(form);
        toast.success('上游通道已创建');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch {
      toast.error(editingId ? '上游通道更新失败' : '上游通道创建失败');
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('确认删除这个上游通道吗？删除后无法恢复。')) return;
    try {
      await providersApi.delete(id);
      toast.success('上游通道已删除');
      load();
    } catch {
      toast.error('上游通道删除失败');
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

  const statusLabel = (status: string) => {
    if (status === 'ERROR') return '异常';
    if (status === 'INACTIVE') return '停用';
    return '活跃';
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">上游通道管理</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> 添加通道
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? '编辑通道' : '新增通道'}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">通道名称</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="例如：n1n" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Base URL</label>
              <input value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://api.n1n.ai/v1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">API Key {editingId && <span className="font-normal text-gray-400">（留空表示不修改）</span>}</label>
              <input type="password" value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder={editingId ? '留空表示不修改' : '上游 API Key'} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
              <input type="number" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: parseInt(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={submitForm} className="btn-primary">{editingId ? '更新通道' : '创建通道'}</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : providers.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无上游通道，请添加第一个通道。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Base URL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">优先级</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider: any) => {
                  const id = provider.id || provider._id;
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{provider.name}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 font-mono text-sm text-gray-600">{provider.baseUrl}</td>
                      <td className="px-4 py-3 text-center text-sm"><span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{provider.priority ?? 0}</span></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(provider.status)}`}>{statusLabel(provider.status || 'ACTIVE')}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{provider.createdAt ? formatDate(provider.createdAt) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(provider)} className="rounded p-1.5 transition-colors hover:bg-gray-100" title="编辑">
                            <Edit3 className="h-4 w-4 text-gray-400" />
                          </button>
                          <button onClick={() => deleteProvider(id)} className="rounded p-1.5 transition-colors hover:bg-red-50" title="删除">
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
