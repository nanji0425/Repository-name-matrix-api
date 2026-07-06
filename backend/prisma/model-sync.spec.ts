import {
  applyMarkup,
  formatModelName,
  buildUpstreamCandidates,
  normalizeUpstreamModels,
} from './model-sync';

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, got ${actualJson}`);
  }
}

const payload = {
  object: 'list',
  data: [
    { id: 'gpt-4o-mini', owned_by: 'openai', pricing: { input: 0.15, output: 0.6 } },
    { id: 'claude-3-5-sonnet', owned_by: 'anthropic', input_price: '3', output_price: '15' },
    { id: 'deepseek-chat', owned_by: 'deepseek', input_price: '0.5', output_price: '2' },
    { id: '', object: 'model' },
    { object: 'model' },
  ],
};

const candidates = buildUpstreamCandidates('https://api.bblabu.cn/v1', 'sk-demo');
const models = normalizeUpstreamModels(payload, 'bblabu');

assertEqual(applyMarkup(10), 13);
assertEqual(applyMarkup(0.123456789), 0.16049383);
assertEqual(formatModelName('gpt-4o-mini'), 'GPT 4o Mini');
assertEqual(candidates.length, 12);
assertEqual(candidates[0].url, 'https://api.bblabu.cn/v1/models');
assertEqual(candidates[0].headers.Authorization, 'Bearer sk-demo');
assertEqual(candidates[1].headers.Authorization, 'sk-demo');
assertEqual(candidates[2].headers['api-key'], 'sk-demo');
assertEqual(candidates[3].headers['x-api-key'], 'sk-demo');
assertEqual(models.length, 3);
assertDeepEqual(models[0], {
  name: 'GPT 4o Mini',
  modelCode: 'gpt-4o-mini',
  providerId: 'bblabu',
  inputPrice: 0.195,
  outputPrice: 0.78,
  multiplier: 1,
  status: 'ACTIVE',
  sortOrder: 1,
});
assertDeepEqual(models[1], {
  name: 'Claude 3 5 Sonnet',
  modelCode: 'claude-3-5-sonnet',
  providerId: 'bblabu',
  inputPrice: 3.9,
  outputPrice: 19.5,
  multiplier: 1,
  status: 'ACTIVE',
  sortOrder: 2,
});
assertDeepEqual(models[2], {
  name: 'DeepSeek Chat',
  modelCode: 'deepseek-chat',
  providerId: 'bblabu',
  inputPrice: 0.65,
  outputPrice: 2.6,
  multiplier: 1,
  status: 'ACTIVE',
  sortOrder: 3,
});

console.log('model-sync tests passed');
