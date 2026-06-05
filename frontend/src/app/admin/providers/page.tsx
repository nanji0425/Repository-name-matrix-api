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
      toast.error('Failed to load providers');
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
    if (!form.name.trim() || !form.baseUrl.trim()) {
      return toast.error('Name and Base URL are required');
    }
    try {
      if (editingId) {
        const updateData: any = { name: form.name, baseUrl: form.baseUrl, priority: form.priority };
        if (form.apiKey.trim()) updateData.apiKey = form.apiKey;
        await providersApi.update(editingId, updateData);
        toast.success('Provider updated');
      } else {
        await providersApi.create(form);
        toast.success('Provider created');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch {
      toast.error(editingId ? 'Failed to update provider' : 'Failed to create provider');
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this provider? This action cannot be undone.')) return;
    try {
      await providersApi.delete(id);
      toast.success('Provider deleted');
      load();
    } catch {
      toast.error('Failed to delete provider');
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editingId ? 'Edit Provider' : 'New Provider'}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g., OpenAI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                value={form.baseUrl}
                onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="https://api.openai.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key {editingId && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder={editingId ? 'Leave blank to keep current' : 'Provider API key'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={submitForm} className="btn-primary">
              {editingId ? 'Update Provider' : 'Create Provider'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Providers Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : providers.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No providers configured. Add your first provider!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base URL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider: any) => (
                  <tr key={provider.id || provider._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{provider.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono max-w-[200px] truncate">
                      {provider.baseUrl}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        {provider.priority ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(provider.status)}`}>
                        {provider.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {provider.createdAt ? formatDate(provider.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(provider)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteProvider(provider.id || provider._id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
