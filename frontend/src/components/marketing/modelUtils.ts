import type { Locale } from '@/stores/localeStore';

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

export type BillingType = 'usage' | 'request';
export type ModelGroup = 'chat' | 'image' | 'video' | 'audio' | 'embedding';

export const ALL_PROVIDER = '__all_provider__';
export const UNKNOWN_PROVIDER = '__unknown_provider__';
export const ALL_GROUP = '__all_group__';
export const ALL_BILLING = '__all_billing__';

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
  ALL_PROVIDER,
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
  UNKNOWN_PROVIDER,
];

export const GROUP_OPTIONS: Array<typeof ALL_GROUP | ModelGroup> = [ALL_GROUP, 'chat', 'image', 'video', 'audio', 'embedding'];
export const BILLING_OPTIONS: Array<typeof ALL_BILLING | BillingType> = [ALL_BILLING, 'usage', 'request'];

const labels = {
  zh: {
    [ALL_PROVIDER]: '全部供应商',
    [UNKNOWN_PROVIDER]: '未知供应商',
    [ALL_GROUP]: '全部分组',
    [ALL_BILLING]: '全部类型',
    chat: '聊天模型',
    image: '图像模型',
    video: '视频模型',
    audio: '语音模型',
    embedding: '嵌入模型',
    usage: '按量计费',
    request: '按次计费',
    requestUnit: '次',
  },
  en: {
    [ALL_PROVIDER]: 'All Providers',
    [UNKNOWN_PROVIDER]: 'Unknown Provider',
    [ALL_GROUP]: 'All Groups',
    [ALL_BILLING]: 'All Types',
    chat: 'Chat Models',
    image: 'Image Models',
    video: 'Video Models',
    audio: 'Audio Models',
    embedding: 'Embedding Models',
    usage: 'Usage Billing',
    request: 'Per Request',
    requestUnit: 'request',
  },
} as const;

export function getFilterLabel(value: string, locale: Locale) {
  const localeLabels = labels[locale] as Record<string, string>;
  return localeLabels[value] || value;
}

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
  return matched?.[0] || UNKNOWN_PROVIDER;
}

export function getModelGroups(model: MarketingModel): ModelGroup[] {
  const text = searchableText(model);
  if (audioKeywords.some((keyword) => text.includes(keyword))) return ['audio'];
  if (videoKeywords.some((keyword) => text.includes(keyword))) return ['video'];
  if (imageKeywords.some((keyword) => text.includes(keyword))) return ['image'];
  if (text.includes('embed') || text.includes('embedding')) return ['embedding'];
  return ['chat'];
}

export function getBillingType(model: MarketingModel): BillingType {
  const text = searchableText(model);
  return [...videoKeywords, ...imageKeywords, ...audioKeywords].some((keyword) => text.includes(keyword)) ? 'request' : 'usage';
}

export function formatModelPrice(value?: number, billingType: BillingType = 'usage', locale: Locale = 'zh') {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  const digits = safeValue >= 10 ? 2 : safeValue >= 1 ? 4 : 6;
  const formatted = safeValue.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '') || '0';
  const unit = billingType === 'request' ? labels[locale].requestUnit : '1K tokens';
  return `¥${formatted} / ${unit}`;
}

export function modelMatches(model: MarketingModel, filters: { provider: string; group: string; billing: string; query: string }) {
  const provider = getProviderName(model);
  const groups = getModelGroups(model);
  const billing = getBillingType(model);
  const code = getModelCode(model);
  const haystack = `${code} ${model.name || ''} ${provider}`.toLowerCase();

  return (
    (filters.provider === ALL_PROVIDER || provider === filters.provider) &&
    (filters.group === ALL_GROUP || groups.includes(filters.group as ModelGroup)) &&
    (filters.billing === ALL_BILLING || billing === filters.billing) &&
    (!filters.query.trim() || haystack.includes(filters.query.trim().toLowerCase()))
  );
}
