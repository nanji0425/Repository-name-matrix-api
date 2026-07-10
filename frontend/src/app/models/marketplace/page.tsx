'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { ModelCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// 模拟模型数据
const models = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    inputPrice: 0.014,
    outputPrice: 0.042,
    category: 'text',
    icon: 'O',
    multiplier: 1.4,
  },
  {
    id: '2',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputPrice: 0.0042,
    outputPrice: 0.0210,
    category: 'text',
    icon: 'C',
    multiplier: 1.4,
  },
  {
    id: '3',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    inputPrice: 0.0049,
    outputPrice: 0.0147,
    category: 'text',
    icon: 'G',
    multiplier: 1.4,
  },
  {
    id: '4',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    inputPrice: 0.04,
    outputPrice: 0,
    category: 'image',
    icon: 'D',
    multiplier: 1.4,
  },
  {
    id: '5',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    inputPrice: 0.0014,
    outputPrice: 0.0028,
    category: 'text',
    icon: 'D',
    multiplier: 1.4,
  },
  {
    id: '6',
    name: 'Qwen 2.5',
    provider: 'Alibaba',
    inputPrice: 0.0007,
    outputPrice: 0.0021,
    category: 'text',
    icon: 'Q',
    multiplier: 1.4,
  },
];

const categories = [
  { id: 'all', label: '全部', count: 156 },
  { id: 'text', label: '文本生成', count: 89 },
  { id: 'image', label: '图像生成', count: 34 },
  { id: 'audio', label: '音频处理', count: 12 },
  { id: 'video', label: '视频生成', count: 6 },
  { id: 'embedding', label: '嵌入向量', count: 8 },
  { id: 'moderation', label: '内容审核', count: 3 },
];

const providers = [
  { id: 'all', label: '所有供应商', count: 156 },
  { id: 'openai', label: 'OpenAI', count: 42 },
  { id: 'anthropic', label: 'Anthropic', count: 15 },
  { id: 'google', label: 'Google', count: 28 },
  { id: 'deepseek', label: 'DeepSeek', count: 18 },
  { id: 'alibaba', label: 'Alibaba', count: 12 },
];

export default function ModelsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesProvider = selectedProvider === 'all' || model.provider.toLowerCase() === selectedProvider;

    return matchesSearch && matchesCategory && matchesProvider;
  });

  return (
    <ConsolePage>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold gradient-text mb-3">模型广场</h1>
        <p className="text-gray-600">本站当前已启用模型，总计 13 个</p>
        <p className="text-sm text-gray-500 mt-1">探索精选 AI 模型，请酌情自格按需能力，为不同场景选择适合的模型</p>
      </div>

      {/* 搜索栏 */}
      <div className="mb-8 flex justify-center">
        <div className="console-search max-w-2xl w-full">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索模型名称、供应商、模型标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* 筛选侧边栏 */}
        <aside className="space-y-6">
          {/* 分类筛选 */}
          <div className="console-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">分组</h3>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-soft'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-xs opacity-75">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 供应商筛选 */}
          <div className="console-card">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">所有供应商</h3>
            </div>
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedProvider === provider.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-soft'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{provider.label}</span>
                  <span className="text-xs opacity-75">{provider.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 定价策略 */}
          <div className="console-card">
            <h3 className="font-bold text-gray-900 mb-4">定价策略</h3>
            <div className="space-y-2">
              <Badge variant="purple" className="w-full justify-center py-2">
                所有倍率 × 1.4
              </Badge>
              <p className="text-xs text-gray-600 text-center mt-2">
                所有模型价格已在上游基础上加价 40%
              </p>
            </div>
          </div>
        </aside>

        {/* 模型卡片网格 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              找到 <span className="font-bold text-purple-600">{filteredModels.length}</span> 个模型
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="purple">最热</Badge>
              <Badge variant="pink">最新</Badge>
              <Badge variant="blue">价格</Badge>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                name={model.name}
                provider={model.provider}
                inputPrice={model.inputPrice}
                outputPrice={model.outputPrice}
                category={model.category}
                icon={
                  <div className="flex h-full w-full items-center justify-center">
                    {model.icon}
                  </div>
                }
              />
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="console-card text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">未找到匹配的模型</h3>
              <p className="text-gray-600">请尝试调整搜索条件或筛选器</p>
            </div>
          )}
        </div>
      </div>
    </ConsolePage>
  );
}
