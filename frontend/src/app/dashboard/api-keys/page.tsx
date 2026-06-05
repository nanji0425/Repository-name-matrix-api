'use client';

import { useEffect, useState } from 'react';
import { apiKeysApi } from '@/lib/api';
import { shortenApiKey, copyToClipboard, formatDate } from '@/lib/utils';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const load = () => apiKeysApi.list().then(r => setKeys(r.data || []));

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return toast.error('Name is required');
    try {
      await apiKeysApi.create({ name: newName });
      toast.success('API key created!');
      setNewName('');
      setShowCreate(false);
      load();
    } catch { toast.error('Failed to create'); }
  };

  const toggle = async (id: string) => {
    try {
      await apiKeysApi.toggle(id);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await apiKeysApi.delete(id);
      toast.success('API key deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Key
        </button>
      </div>

      {showCreate && (
        <div className="card p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g., Production API Key"
              onKeyDown={e => e.key === 'Enter' && create()}
            />
          </div>
          <button onClick={create} className="btn-primary">Create</button>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="card p-12 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No API keys yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key: any) => (
            <div key={key.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{key.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {shortenApiKey(key.secret)}
                    </code>
                    <button onClick={() => { copyToClipboard(key.secret); toast.success('Copied!'); }}>
                      <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Created: {formatDate(key.createdAt)}</span>
                    {key.lastUsed && <span>Last used: {formatDate(key.lastUsed)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    key.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {key.status}
                  </span>
                  <button onClick={() => toggle(key.id)} className="p-1 hover:bg-gray-100 rounded" title="Toggle status">
                    {key.status === 'ACTIVE' ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => remove(key.id)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
