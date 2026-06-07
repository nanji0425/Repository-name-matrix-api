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

export const SUPPLIER_OPTIONS = [
  '全部供应商',
  'Runway',
  'Fast mode',
  'OpenAI',
  'Google',
  '字节跳动',
  'MiniMax',
  'Anthropic',
  'DeepSeek',
  '未知供应商',
];

export const GROUP_OPTIONS = ['全部分组', '聊天分组', '视频分组', 'gemini图片分组'];
export const BILLING_OPTIONS = ['全部类型', '按量计费', '按次计费'];

const providerMatchers: Array<[string, string[]]> = [
  ['OpenAI', ['gpt', 'o1', 'o3', 'o4', 'dall', 'whisper', 'tts', 'openai']],
  ['DeepSeek', ['deepseek']],
  ['Anthropic', ['claude', 'anthropic']],
  ['Google', ['gemini', 'google', 'veo']],
  ['MiniMax', ['hailuo', 'minimax']],
  ['Runway', ['runway']],
  ['字节跳动', ['doubao', 'seed', 'jimeng', 'bytedance', '字节', '豆包', '即梦']],
  ['Fast mode', ['fast']],
];

const videoKeywords = ['video', 'sora', 'veo', 'runway', 'kling', 'pika', 'hailuo', 'jimeng', '即梦', '视频'];
const imageKeywords = ['image', 'dall', 'sd', 'flux', 'midjourney', 'stable', 'gemini-image', '图片', '图像'];
const audioKeywords = ['audio', 'tts', 'whisper', 'voice', 'speech', 'music', '语音', '音频'];

export function getModelCode(model: MarketingModel) {
  return model.modelCode || model.name || model.id || 'unknown-model';
}

function searchableText(model: MarketingModel) {
  const provider = typeof model.provider === 'string' ? model.provider : model.provider?.name || model.provider?.id || model.providerId || '';
  return `${getModelCode(model)} ${model.name || ''} ${provider}`.toLowerCase();
}

export function getProviderName(model: MarketingModel) {
  const text = searchableText(model);
  const matched = providerMatchers.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  return matched?.[0] || '未知供应商';
}

export function getModelGroups(model: MarketingModel) {
  const text = searchableText(model);
  if (text.includes('gemini') && imageKeywords.some((keyword) => text.includes(keyword))) return ['gemini图片分组'];
  if (videoKeywords.some((keyword) => text.includes(keyword))) return ['视频分组'];
  return ['聊天分组'];
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
