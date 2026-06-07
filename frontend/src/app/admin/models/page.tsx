'use client';

import { useEffect, useState } from 'react';
import api, { modelsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Brain, Plus, Trash2, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setModels(data.data || data || []);
    } catch {
      toast.error('模型列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', modelCode: '', providerId: '', inputPrice: 0, outputPrice: 0, multiplier: 1 });
  };

  const addModel = async () => {
    if (!form.name.trim() || !form.modelCode.trim() || !form.providerId.trim()) {
      return toast.error('请填写模型名称、模型编码和上游通道');
    }
    try {
      await api.post('/models', form);
      toast.success('模型已添加');
      setShowAdd(false);
      resetForm();
      load();
    } catch {
      toast.error('模型添加失败');
    }
  };

  const toggleModelStatus = async (id: string) => {
    try {
      await api.patch(`/models/${id}/toggle`);
      toast.success('模型状态已更新');
      load();
    } catch {
      toast.error('模型状态更新失败');
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm('确认删除这个模型吗？删除后无法恢复。')) return;
    try {
      await api.delete(`/models/${id}`);
      toast.success('模型已删除');
      load();
    } catch {
      toast.error('模型删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">模型管理</h1>
        <button onClick={() => { setShowAdd(!showAdd); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" /> 添加模型
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">新增模型</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="例如：GPT-4 Turbo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型编码</label>
              <input
                value={form.modelCode}
                onChange={e => setForm(f => ({ ...f, modelCode: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="例如：gpt-4-turbo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上游通道 ID</label>
              <input
                value={form.providerId}
                onChange={e => setForm(f => ({ ...f, providerId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="上游通道 ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">倍率</label>
              <input
                type="number"
                step="0.1"
                value={form.multiplier}
                onChange={e => setForm(f => ({ ...f, multiplier: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">输入价格（每 token）</label>
              <input
                type="number"
                step="0.0000001"
                value={form.inputPrice}
                onChange={e => setForm(f => ({ ...f, inputPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="0.00001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">输出价格（每 token）</label>
              <input
                type="number"
                step="0.0000001"
                value={form.outputPrice}
                onChange={e => setForm(f => ({ ...f, outputPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="0.00003"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={addModel} className="btn-primary">创建模型</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400">正在加载...</div>
      ) : models.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无模型，请添加第一个模型。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型编码</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">上游</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">输入价格</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">输出价格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {models.map((model: any) => (
                  <tr key={model.id || model._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{model.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{model.modelCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {model.provider
                        ? typeof model.provider === 'object'
                          ? model.provider.name || model.provider.id
                          : model.provider
                        : model.providerId
                        ? String(model.providerId).substring(0, 8) + '...'
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {model.inputPrice != null ? formatCurrency(model.inputPrice) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {model.outputPrice != null ? formatCurrency(model.outputPrice) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        model.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {model.status === 'ACTIVE' || !model.status ? '活跃' : '已停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleModelStatus(model.id || model._id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={model.status === 'ACTIVE' ? '停用' : '启用'}
                        >
                          {model.status === 'ACTIVE'
                            ? <EyeOff className="w-4 h-4 text-gray-400" />
                            : <Eye className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                        <button
                          onClick={() => deleteModel(model.id || model._id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="删除"
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
