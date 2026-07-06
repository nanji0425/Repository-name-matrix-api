'use client';

import { useEffect, useState } from 'react';
import { modelsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Brain, Eye, EyeOff, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '模型管理',
    syncing: '同步中...',
    sync: '同步上游',
    add: '添加模型',
    createTitle: '新增模型',
    name: '模型名称',
    code: '模型编码',
    providerId: '上游通道 ID',
    multiplier: '倍率',
    inputPrice: '输入价格（每 1K token）',
    outputPrice: '输出价格（每 1K token）',
    create: '创建模型',
    cancel: '取消',
    loading: '正在加载...',
    empty: '暂无模型，请同步上游或手动添加模型。',
    active: '活跃',
    disabled: '已停用',
    disable: '停用',
    enable: '启用',
    delete: '删除',
    listFailed: '模型列表加载失败',
    syncDone: '上游模型同步完成',
    syncFailed: '同步上游模型失败',
    required: '请填写模型名称、模型编码和上游通道',
    added: '模型已添加',
    addFailed: '模型添加失败',
    statusUpdated: '模型状态已更新',
    statusFailed: '模型状态更新失败',
    deleteConfirm: '确认删除这个模型吗？删除后无法恢复。',
    deleted: '模型已删除',
    deleteFailed: '模型删除失败',
    exampleName: '例如：GPT-5.5',
    exampleCode: '例如：gpt-5.5',
    exampleProvider: '例如：bblabu',
    table: ['名称', '模型编码', '上游', '输入价格', '输出价格', '状态', '操作'],
  },
  en: {
    title: 'Model Management',
    syncing: 'Syncing...',
    sync: 'Sync Upstream',
    add: 'Add Model',
    createTitle: 'New Model',
    name: 'Model Name',
    code: 'Model Code',
    providerId: 'Provider ID',
    multiplier: 'Multiplier',
    inputPrice: 'Input price (per 1K token)',
    outputPrice: 'Output price (per 1K token)',
    create: 'Create Model',
    cancel: 'Cancel',
    loading: 'Loading...',
    empty: 'No models yet. Sync upstream or add a model manually.',
    active: 'Active',
    disabled: 'Disabled',
    disable: 'Disable',
    enable: 'Enable',
    delete: 'Delete',
    listFailed: 'Failed to load models',
    syncDone: 'Upstream model sync completed',
    syncFailed: 'Failed to sync upstream models',
    required: 'Model name, model code, and provider channel are required',
    added: 'Model added',
    addFailed: 'Failed to add model',
    statusUpdated: 'Model status updated',
    statusFailed: 'Failed to update model status',
    deleteConfirm: 'Delete this model? This cannot be undone.',
    deleted: 'Model deleted',
    deleteFailed: 'Failed to delete model',
    exampleName: 'Example: GPT-5.5',
    exampleCode: 'Example: gpt-5.5',
    exampleProvider: 'Example: bblabu',
    table: ['Name', 'Model Code', 'Provider', 'Input Price', 'Output Price', 'Status', 'Actions'],
  },
} as const;

export default function AdminModelsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    modelCode: '',
    providerId: '',
    inputPrice: 0,
    outputPrice: 0,
    multiplier: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await modelsApi.listAll();
      setModels(data.data || data.items || data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.listFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUpstream = async () => {
    setSyncing(true);
    try {
      const { data } = await modelsApi.sync();
      toast.success(`${text.syncDone}: ${data.synced ?? 0}`);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.syncFailed);
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', modelCode: '', providerId: '', inputPrice: 0, outputPrice: 0, multiplier: 1 });
  };

  const addModel = async () => {
    if (!form.name.trim() || !form.modelCode.trim() || !form.providerId.trim()) {
      toast.error(text.required);
      return;
    }

    try {
      await modelsApi.create(form);
      toast.success(text.added);
      setShowAdd(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.addFailed);
    }
  };

  const toggleModelStatus = async (id: string) => {
    try {
      await modelsApi.toggle(id);
      toast.success(text.statusUpdated);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.statusFailed);
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return;
    try {
      await modelsApi.delete(id);
      toast.success(text.deleted);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.deleteFailed);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <div className="flex items-center gap-3">
          <button onClick={syncUpstream} disabled={syncing} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? text.syncing : text.sync}
          </button>
          <button onClick={() => { setShowAdd(!showAdd); resetForm(); }} className="btn-primary">
            <Plus className="h-4 w-4" /> {text.add}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card mb-6 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950 dark:text-white">{text.createTitle}</h3>
            <button onClick={() => setShowAdd(false)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.name}</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.exampleName} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.code}</label>
              <input value={form.modelCode} onChange={(event) => setForm((current) => ({ ...current, modelCode: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.exampleCode} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.providerId}</label>
              <input value={form.providerId} onChange={(event) => setForm((current) => ({ ...current, providerId: event.target.value }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={text.exampleProvider} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.multiplier}</label>
              <input type="number" step="0.1" value={form.multiplier} onChange={(event) => setForm((current) => ({ ...current, multiplier: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="1.0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.inputPrice}</label>
              <input type="number" step="0.0000001" value={form.inputPrice} onChange={(event) => setForm((current) => ({ ...current, inputPrice: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="0.00001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.outputPrice}</label>
              <input type="number" step="0.0000001" value={form.outputPrice} onChange={(event) => setForm((current) => ({ ...current, outputPrice: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="0.00003" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addModel} className="btn-primary">{text.create}</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">{text.cancel}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">{text.loading}</div>
      ) : models.length === 0 ? (
        <div className="card p-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <Brain className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{text.empty}</p>
        </div>
      ) : (
        <div className="card overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
                  {text.table.map((item, index) => (
                    <th key={item} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${index === 3 || index === 4 ? 'text-right' : index === 6 ? 'text-center' : 'text-left'}`}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {models.map((model: any) => {
                  const id = model.id || model._id;
                  const active = model.status === 'ACTIVE' || !model.status;
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm font-medium text-slate-950 dark:text-white">{model.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-slate-300">{model.modelCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                        {model.provider
                          ? typeof model.provider === 'object'
                            ? model.provider.name || model.provider.id
                            : model.provider
                          : model.providerId || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                        {model.inputPrice != null ? formatCurrency(model.inputPrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                        {model.outputPrice != null ? formatCurrency(model.outputPrice) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? text.active : text.disabled}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => toggleModelStatus(id)} className="rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10" title={active ? text.disable : text.enable}>
                            {active ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                          <button onClick={() => deleteModel(id)} className="rounded p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10" title={text.delete}>
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
