'use client';

import { useEffect, useState } from 'react';
import { announcementsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, Edit3, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

function toDateInput(value?: string | null) {
  return value ? value.split('T')[0] : '';
}

function toStartAt(value: string) {
  return value ? `${value}T00:00:00.000Z` : null;
}

function toEndAt(value: string) {
  return value ? `${value}T23:59:59.999Z` : null;
}

const copy = {
  zh: {
    title: '公告管理',
    newAnnouncement: '新建公告',
    editAnnouncement: '编辑公告',
    titleLabel: '标题',
    titlePlaceholder: '公告标题',
    content: '内容',
    contentPlaceholder: '公告内容',
    priority: '优先级',
    publishNow: '立即发布',
    startDate: '开始日期',
    endDate: '结束日期',
    update: '更新',
    create: '创建',
    cancel: '取消',
    loading: '正在加载...',
    empty: '暂无公告，请创建第一条公告。',
    loadFailed: '公告加载失败',
    required: '请填写公告标题和内容',
    updated: '公告已更新',
    created: '公告已创建',
    updateFailed: '公告更新失败',
    createFailed: '公告创建失败',
    deleteConfirm: '确认删除这条公告吗？删除后无法恢复。',
    deleted: '公告已删除',
    deleteFailed: '公告删除失败',
    unpublished: '公告已取消发布',
    publishedToast: '公告已发布',
    statusFailed: '公告状态更新失败',
    published: '已发布',
    draft: '草稿',
    publish: '发布',
    unpublish: '取消发布',
    edit: '编辑',
    delete: '删除',
    starts: '开始',
    ends: '结束',
    createdAt: '创建',
    priorities: [
      { value: 10, label: '高', className: 'bg-red-50 text-red-700' },
      { value: 5, label: '普通', className: 'bg-blue-50 text-blue-700' },
      { value: 0, label: '低', className: 'bg-gray-100 text-gray-500' },
    ],
  },
  en: {
    title: 'Announcement Management',
    newAnnouncement: 'New Announcement',
    editAnnouncement: 'Edit Announcement',
    titleLabel: 'Title',
    titlePlaceholder: 'Announcement title',
    content: 'Content',
    contentPlaceholder: 'Announcement content',
    priority: 'Priority',
    publishNow: 'Publish immediately',
    startDate: 'Start Date',
    endDate: 'End Date',
    update: 'Update',
    create: 'Create',
    cancel: 'Cancel',
    loading: 'Loading...',
    empty: 'No announcements yet. Create the first one.',
    loadFailed: 'Failed to load announcements',
    required: 'Title and content are required',
    updated: 'Announcement updated',
    created: 'Announcement created',
    updateFailed: 'Failed to update announcement',
    createFailed: 'Failed to create announcement',
    deleteConfirm: 'Delete this announcement? This cannot be undone.',
    deleted: 'Announcement deleted',
    deleteFailed: 'Failed to delete announcement',
    unpublished: 'Announcement unpublished',
    publishedToast: 'Announcement published',
    statusFailed: 'Failed to update announcement status',
    published: 'Published',
    draft: 'Draft',
    publish: 'Publish',
    unpublish: 'Unpublish',
    edit: 'Edit',
    delete: 'Delete',
    starts: 'Starts',
    ends: 'Ends',
    createdAt: 'Created',
    priorities: [
      { value: 10, label: 'High', className: 'bg-red-50 text-red-700' },
      { value: 5, label: 'Normal', className: 'bg-blue-50 text-blue-700' },
      { value: 0, label: 'Low', className: 'bg-gray-100 text-gray-500' },
    ],
  },
} as const;

export default function AdminAnnouncementsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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

  const priorityMeta = (priority: number) => text.priorities.find((item) => item.value === priority) || text.priorities[1];

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await announcementsApi.listAll({ page: 1, limit: 50 });
      setAnnouncements(data.items || data.data || data.announcements || data || []);
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
      toast.error(text.required);
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
        toast.success(text.updated);
      } else {
        await announcementsApi.create(payload);
        toast.success(text.created);
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? text.updateFailed : text.createFailed));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return;
    try {
      await announcementsApi.delete(id);
      toast.success(text.deleted);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.deleteFailed);
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    try {
      await announcementsApi.update(id, { published: !current });
      toast.success(current ? text.unpublished : text.publishedToast);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.statusFailed);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> {text.newAnnouncement}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950 dark:text-white">{editingId ? text.editAnnouncement : text.newAnnouncement}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.titleLabel}</label>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder={text.titlePlaceholder} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.content}</label>
              <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={4} className="w-full resize-y rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder={text.contentPlaceholder} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.priority}</label>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                  {text.priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-2">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{text.publishNow}</span>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.startDate}</label>
                <input type="date" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.endDate}</label>
                <input type="date" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={submitForm} className="btn-primary">{editingId ? text.update : text.create}</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">{text.cancel}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item: any) => {
            const id = item.id || item._id;
            const published = Boolean(item.published);
            const meta = priorityMeta(Number(item.priority ?? 5));
            return (
              <div key={id} className="card p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>{meta.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{published ? text.published : text.draft}</span>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {item.startAt && <span>{text.starts}: {formatDate(item.startAt)}</span>}
                      {item.endAt && <span>{text.ends}: {formatDate(item.endAt)}</span>}
                      {item.createdAt && <span>{text.createdAt}: {formatDate(item.createdAt)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => togglePublished(id, published)} className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${published ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {published ? text.unpublish : text.publish}
                    </button>
                    <button onClick={() => openEdit(item)} className="rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10" title={text.edit}>
                      <Edit3 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button onClick={() => deleteAnnouncement(id)} className="rounded p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10" title={text.delete}>
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
