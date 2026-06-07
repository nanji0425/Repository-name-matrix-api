'use client';

import { useEffect, useState } from 'react';
import api, { announcementsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

const priorityText: Record<string, string> = {
  HIGH: '高',
  NORMAL: '普通',
  LOW: '低',
};

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
      toast.error('公告加载失败');
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

  const openEdit = (item: any) => {
    setForm({
      title: item.title || '',
      content: item.content || '',
      priority: item.priority || 'NORMAL',
      published: item.published ?? (item.status === 'PUBLISHED'),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
    });
    setEditingId(item.id || item._id);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('请填写公告标题和内容');
    try {
      const payload = { ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined };
      if (editingId) {
        await api.patch(`/announcements/${editingId}`, payload);
        toast.success('公告已更新');
      } else {
        await api.post('/announcements', payload);
        toast.success('公告已创建');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch {
      toast.error(editingId ? '公告更新失败' : '公告创建失败');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('确认删除这条公告吗？删除后无法恢复。')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('公告已删除');
      load();
    } catch {
      toast.error('公告删除失败');
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    try {
      await api.patch(`/announcements/${id}`, { published: !current });
      toast.success(current ? '公告已取消发布' : '公告已发布');
      load();
    } catch {
      toast.error('公告状态更新失败');
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">公告管理</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> 新建公告
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? '编辑公告' : '新建公告'}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标题</label>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="公告标题" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">内容</label>
              <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={4} className="w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="公告内容..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="HIGH">高</option>
                  <option value="NORMAL">普通</option>
                  <option value="LOW">低</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700">立即发布</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">开始日期</label>
                <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">结束日期</label>
                <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={submitForm} className="btn-primary">{editingId ? '更新' : '创建'}</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无公告，请创建第一条公告。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item: any) => {
            const id = item.id || item._id;
            const published = item.published || item.status === 'PUBLISHED';
            return (
              <div key={id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityBadge(item.priority)}`}>{priorityText[item.priority] || '普通'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{published ? '已发布' : '草稿'}</span>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600">{item.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {item.startDate && <span>开始：{formatDate(item.startDate)}</span>}
                      {item.endDate && <span>结束：{formatDate(item.endDate)}</span>}
                      {item.createdAt && <span>创建：{formatDate(item.createdAt)}</span>}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <button onClick={() => togglePublished(id, published)} className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${published ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {published ? '取消发布' : '发布'}
                    </button>
                    <button onClick={() => openEdit(item)} className="rounded p-1.5 transition-colors hover:bg-gray-100" title="编辑">
                      <Edit3 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button onClick={() => deleteAnnouncement(id)} className="rounded p-1.5 transition-colors hover:bg-red-50" title="删除">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
