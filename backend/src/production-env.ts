const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'UPSTREAM_API_KEY',
  'UPSTREAM_BASE_URL',
  'API_PUBLIC_URL',
  'FRONTEND_URL',
  'FRONTEND_URLS',
  'ZPAY_PID',
  'ZPAY_KEY',
  'ZPAY_NOTIFY_URL',
  'ZPAY_RETURN_URL',
] as const;

const MIN_LENGTHS: Record<string, number> = {
  JWT_SECRET: 32,
  ZPAY_KEY: 16,
  ZPAY_PID: 8,
  UPSTREAM_API_KEY: 20,
};

const URL_VARS = [
  'UPSTREAM_BASE_URL',
  'API_PUBLIC_URL',
  'FRONTEND_URL',
  'ZPAY_NOTIFY_URL',
  'ZPAY_RETURN_URL',
] as const;

function isPlaceholder(value: string) {
  return /^(change-me|sk-change-me|your-|example|example-|test|test-|demo|demo-)/.test(value);
}

function assertHttpUrl(name: string, value: string) {
  if (!/^https?:\/\//.test(value)) {
    throw new Error(`${name} must start with http:// or https://`);
  }
}

export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return;

  for (const name of REQUIRED_PRODUCTION_VARS) {
    const value = env[name]?.trim();
    if (!value) {
      throw new Error(`${name} is required in production`);
    }

    if (isPlaceholder(value)) {
      throw new Error(`${name} contains a placeholder value`);
    }

    const minLength = MIN_LENGTHS[name];
    if (minLength && value.length < minLength) {
      throw new Error(`${name} must be at least ${minLength} characters`);
    }
  }

  for (const name of URL_VARS) {
    assertHttpUrl(name, env[name] || '');
  }

  for (const origin of (env.FRONTEND_URLS || '').split(',')) {
    const trimmed = origin.trim();
    if (trimmed) assertHttpUrl('FRONTEND_URLS', trimmed);
  }

  if (env.ALLOW_FALLBACK_MODELS === 'true') {
    throw new Error('ALLOW_FALLBACK_MODELS must not be true in production');
  }
}
