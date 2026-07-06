'use client';

import { useEffect, useState } from 'react';
import { modelsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Brain, Eye, EyeOff, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminModelsPage() {
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
      toast.error(error.response?.data?.message || '模型列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const syncUpstream = async () => {
    setSyncing(true);
    try {
      const { data } = await modelsApi.sync();
      toast.success(`上游模型同步完成：${data.synced ?? 0} 个`);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '同步上游模型失败');
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', modelCode: '', providerId: '', inputPrice: 0, outputPrice: 0, multiplier: 1 });
  };

  const addModel = async () => {
    if (!form.name.trim() || !form.modelCode.trim() || !form.providerId.trim()) {
      toast.error('请填写模型名称、模型编码和上游通道');
      return;
    }

    try {
      await modelsApi.create(form);
      toast.success('模型已添加');
      setShowAdd(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '模型添加失败');
    }
  };

  const toggleModelStatus = async (id: string) => {
    try {
      await modelsApi.toggle(id);
      toast.success('模型状态已更新');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '模型状态更新失败');
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm('确认删除这个模型吗？删除后无法恢复。')) return;
    try {
      await modelsApi.delete(id);
      toast.success('模型已删除');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '模型删除失败');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">模型管理</h1>
        <div className="flex items-center gap-3">
          <button onClick={syncUpstream} disabled={syncing} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步上游'}
          </button>
          <button onClick={() => { setShowAdd(!showAdd); resetForm(); }} className="btn-primary">
            <Plus className="h-4 w-4" /> 添加模型
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">新增模型</h3>
            <button onClick={() => setShowAdd(false)} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">模型名称</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="例如：GPT-5.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">模型编码</label>
              <input value={form.modelCode} onChange={(event) => setForm((current) => ({ ...current, modelCode: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="例如：gpt-5.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">上游通道 ID</label>
              <input value={form.providerId} onChange={(event) => setForm((current) => ({ ...current, providerId: event.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="例如：bblabu" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">倍率</label>
              <input type="number" step="0.1" value={form.multiplier} onChange={(event) => setForm((current) => ({ ...current, multiplier: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="1.0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">输入价格（每 1K token）</label>
              <input type="number" step="0.0000001" value={form.inputPrice} onChange={(event) => setForm((current) => ({ ...current, inputPrice: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.00001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">输出价格（每 1K token）</label>
              <input type="number" step="0.0000001" value={form.outputPrice} onChange={(event) => setForm((current) => ({ ...current, outputPrice: parseFloat(event.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.00003" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addModel} className="btn-primary">创建模型</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : models.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">暂无模型，请同步上游或手动添加模型。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">模型编码</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">上游</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">输入价格</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">输出价格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {models.map((model: any) => {
                  const id = model.id || model._id;
                  const active = model.status === 'ACTIVE' || !model.status;
                  return (
                    <tr key={id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{model.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">{model.modelCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {model.provider
                          ? typeof model.provider === 'object'
                            ? model.provider.name || model.provider.id
                            : model.provider
                          : model.providerId || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {model.inputPrice != null ? formatCurrency(model.inputPrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {model.outputPrice != null ? formatCurrency(model.outputPrice) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? '活跃' : '已停用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => toggleModelStatus(id)} className="rounded p-1.5 transition-colors hover:bg-gray-100" title={active ? '停用' : '启用'}>
                            {active ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                          <button onClick={() => deleteModel(id)} className="rounded p-1.5 transition-colors hover:bg-red-50" title="删除">
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
