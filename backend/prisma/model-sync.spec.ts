import {
  applyMarkup,
  formatModelName,
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
    { id: 'gpt-4o-mini', pricing: { input: 0.15, output: 0.6 } },
    { id: 'claude-3-5-sonnet', input_price: '3', output_price: '15' },
    { id: '', object: 'model' },
    { object: 'model' },
  ],
};

const models = normalizeUpstreamModels(payload, 'n1n');

assertEqual(applyMarkup(10), 13);
assertEqual(applyMarkup(0.123456789), 0.16049383);
assertEqual(formatModelName('gpt-4o-mini'), 'GPT 4o Mini');
assertEqual(models.length, 2);
assertDeepEqual(models[0], {
  name: 'GPT 4o Mini',
  modelCode: 'gpt-4o-mini',
  providerId: 'n1n',
  inputPrice: 0.195,
  outputPrice: 0.78,
  multiplier: 1,
  status: 'ACTIVE',
  sortOrder: 1,
});
assertDeepEqual(models[1], {
  name: 'Claude 3 5 Sonnet',
  modelCode: 'claude-3-5-sonnet',
  providerId: 'n1n',
  inputPrice: 3.9,
  outputPrice: 19.5,
  multiplier: 1,
  status: 'ACTIVE',
  sortOrder: 2,
});

console.log('model-sync tests passed');
