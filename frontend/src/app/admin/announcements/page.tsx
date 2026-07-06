'use client';

import { useEffect, useState } from 'react';
import { announcementsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, Edit3, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const priorities = [
  { value: 10, label: '高', className: 'bg-red-50 text-red-700' },
  { value: 5, label: '普通', className: 'bg-blue-50 text-blue-700' },
  { value: 0, label: '低', className: 'bg-gray-100 text-gray-500' },
];

function toDateInput(value?: string | null) {
  return value ? value.split('T')[0] : '';
}

function toStartAt(value: string) {
  return value ? `${value}T00:00:00.000Z` : null;
}

function toEndAt(value: string) {
  return value ? `${value}T23:59:59.999Z` : null;
}

function priorityMeta(priority: number) {
  return priorities.find((item) => item.value === priority) || priorities[1];
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 5,
    published: false,
    startAt: '',
    endAt: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await announcementsApi.listAll({ page: 1, limit: 50 });
      setAnnouncements(data.items || data.data || data.announcements || data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '公告加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', priority: 5, published: false, startAt: '', endAt: '' });
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
      priority: Number(item.priority ?? 5),
      published: Boolean(item.published),
      startAt: toDateInput(item.startAt),
      endAt: toDateInput(item.endAt),
    });
    setEditingId(item.id || item._id);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('请填写公告标题和内容');
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: Number(form.priority),
        published: form.published,
        startAt: toStartAt(form.startAt),
        endAt: toEndAt(form.endAt),
      };

      if (editingId) {
        await announcementsApi.update(editingId, payload);
        toast.success('公告已更新');
      } else {
        await announcementsApi.create(payload);
        toast.success('公告已创建');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? '公告更新失败' : '公告创建失败'));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('确认删除这条公告吗？删除后无法恢复。')) return;
    try {
      await announcementsApi.delete(id);
      toast.success('公告已删除');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '公告删除失败');
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    try {
      await announcementsApi.update(id, { published: !current });
      toast.success(current ? '公告已取消发布' : '公告已发布');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '公告状态更新失败');
    }
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
              <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={4} className="w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="公告内容" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                  {priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-2">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-gray-700">立即发布</span>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">开始日期</label>
                <input type="date" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">结束日期</label>
                <input type="date" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
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
            const published = Boolean(item.published);
            const meta = priorityMeta(Number(item.priority ?? 5));
            return (
              <div key={id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>{meta.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{published ? '已发布' : '草稿'}</span>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {item.startAt && <span>开始：{formatDate(item.startAt)}</span>}
                      {item.endAt && <span>结束：{formatDate(item.endAt)}</span>}
                      {item.createdAt && <span>创建：{formatDate(item.createdAt)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
