'use client';

import { useEffect, useState } from 'react';
import api, { announcementsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    published: false,
    startDate: '',
    endDate: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await announcementsApi.listAll();
      setAnnouncements(data.data || data.announcements || data || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', priority: 'NORMAL', published: false, startDate: '', endDate: '' });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setForm({
      title: a.title || '',
      content: a.content || '',
      priority: a.priority || 'NORMAL',
      published: a.published ?? (a.status === 'PUBLISHED') ?? false,
      startDate: a.startDate ? a.startDate.split('T')[0] : '',
      endDate: a.endDate ? a.endDate.split('T')[0] : '',
    });
    setEditingId(a.id || a._id);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Title and content are required');
    }
    try {
      const payload = { ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined };
      if (editingId) {
        await api.patch(`/announcements/${editingId}`, payload);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', payload);
        toast.success('Announcement created');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch {
      toast.error(editingId ? 'Failed to update announcement' : 'Failed to create announcement');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      load();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    try {
      await api.patch(`/announcements/${id}`, { published: !current });
      toast.success(`Announcement ${current ? 'unpublished' : 'published'}`);
      load();
    } catch {
      toast.error('Failed to update announcement');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      HIGH: 'bg-red-50 text-red-700',
      NORMAL: 'bg-blue-50 text-blue-700',
      LOW: 'bg-gray-100 text-gray-500',
    };
    return map[priority] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Announcement Management</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-vertical"
                placeholder="Announcement content..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={submitForm} className="btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No announcements yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <div key={a.id || a._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(a.priority)}`}>
                      {a.priority || 'NORMAL'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.published || a.status === 'PUBLISHED'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {a.published || a.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {a.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {a.startDate && <span>From: {formatDate(a.startDate)}</span>}
                    {a.endDate && <span>To: {formatDate(a.endDate)}</span>}
                    {a.createdAt && <span>Created: {formatDate(a.createdAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => togglePublished(a.id || a._id, a.published || a.status === 'PUBLISHED')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      a.published || a.status === 'PUBLISHED'
                        ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {a.published || a.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.id || a._id)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
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
