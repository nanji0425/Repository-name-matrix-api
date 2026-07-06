export type MarketingModel = {
  id?: string;
  name?: string;
  modelCode?: string;
  providerId?: string;
  provider?: { id?: string; name?: string } | string | null;
  inputPrice?: number;
  outputPrice?: number;
  multiplier?: number;
};

const gatewayProviderNames = ['hohoapi', 'n1n', 'matrixapi', 'new api', 'new-api', 'api'];

const providerMatchers: Array<[string, string[]]> = [
  ['OpenAI', ['gpt', 'o1', 'o3', 'o4', 'openai', 'dall', 'whisper', 'tts', 'sora']],
  ['DeepSeek', ['deepseek']],
  ['Anthropic', ['claude', 'anthropic']],
  ['Google', ['gemini', 'google', 'veo']],
  ['xAI', ['grok', 'xai']],
  ['ByteDance', ['doubao', 'seed', 'jimeng', 'bytedance', 'volc', 'hunyuan']],
  ['MiniMax', ['hailuo', 'minimax']],
  ['Runway', ['runway']],
  ['Qwen', ['qwen', 'qwq']],
  ['Midjourney', ['midjourney']],
  ['Stability', ['stable', 'sd', 'flux', 'stability']],
  ['Luma', ['luma']],
  ['Kling', ['kling']],
  ['Moonshot', ['moonshot', 'kimi']],
];

const videoKeywords = ['video', 'sora', 'veo', 'runway', 'kling', 'pika', 'hailuo', 'jimeng', '视频'];
const imageKeywords = ['image', 'dall', 'sd', 'flux', 'midjourney', 'stable', 'gemini-image', '图像', '图片'];
const audioKeywords = ['audio', 'tts', 'whisper', 'voice', 'speech', 'music', '语音', '音频'];

export const SUPPLIER_OPTIONS = [
  '全部供应商',
  'OpenAI',
  'DeepSeek',
  'Anthropic',
  'Google',
  'xAI',
  'ByteDance',
  'MiniMax',
  'Runway',
  'Qwen',
  'Midjourney',
  'Stability',
  'Luma',
  'Kling',
  'Moonshot',
  '未知供应商',
];

export const GROUP_OPTIONS = ['全部分组', '聊天模型', '图像模型', '视频模型', '语音模型', '嵌入模型'];
export const BILLING_OPTIONS = ['全部类型', '按量计费', '按次计费'];

export function getModelCode(model: MarketingModel) {
  return model.modelCode || model.name || model.id || 'unknown-model';
}

function searchableText(model: MarketingModel) {
  const providerText = typeof model.provider === 'string' ? model.provider : model.provider?.name || model.provider?.id || model.providerId || '';
  const safeProviderText = gatewayProviderNames.some((keyword) => providerText.toLowerCase().includes(keyword)) ? '' : providerText;
  return `${getModelCode(model)} ${model.name || ''} ${safeProviderText}`.toLowerCase();
}

export function getProviderName(model: MarketingModel) {
  const text = searchableText(model);
  const matched = providerMatchers.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  return matched?.[0] || '未知供应商';
}

export function getModelGroups(model: MarketingModel) {
  const text = searchableText(model);
  if (audioKeywords.some((keyword) => text.includes(keyword))) return ['语音模型'];
  if (videoKeywords.some((keyword) => text.includes(keyword))) return ['视频模型'];
  if (imageKeywords.some((keyword) => text.includes(keyword))) return ['图像模型'];
  if (text.includes('embed') || text.includes('embedding')) return ['嵌入模型'];
  return ['聊天模型'];
}

export function getBillingType(model: MarketingModel) {
  const text = searchableText(model);
  return [...videoKeywords, ...imageKeywords, ...audioKeywords].some((keyword) => text.includes(keyword)) ? '按次计费' : '按量计费';
}

export function formatModelPrice(value?: number, billingType = '按量计费') {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  const digits = safeValue >= 10 ? 2 : safeValue >= 1 ? 4 : 6;
  const formatted = safeValue.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '') || '0';
  const unit = billingType === '按次计费' ? '次' : '1K tokens';
  return `¥${formatted} / ${unit}`;
}

export function modelMatches(model: MarketingModel, filters: { provider: string; group: string; billing: string; query: string }) {
  const provider = getProviderName(model);
  const groups = getModelGroups(model);
  const billing = getBillingType(model);
  const code = getModelCode(model);
  const haystack = `${code} ${model.name || ''} ${provider}`.toLowerCase();

  return (
    (filters.provider === '全部供应商' || provider === filters.provider) &&
    (filters.group === '全部分组' || groups.includes(filters.group)) &&
    (filters.billing === '全部类型' || billing === filters.billing) &&
    (!filters.query.trim() || haystack.includes(filters.query.trim().toLowerCase()))
  );
}
