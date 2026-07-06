import assert from 'node:assert/strict';
import { validateProductionEnv } from './production-env';

const validEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://matrixapi:strong-password@postgres:5432/matrix_api?schema=public',
  JWT_SECRET: 'a'.repeat(32),
  UPSTREAM_API_KEY: 'sk-live-upstream-key-123456',
  UPSTREAM_BASE_URL: 'https://api.bblabu.chat/v1',
  API_PUBLIC_URL: 'https://matrixapi.online/api',
  FRONTEND_URL: 'https://matrixapi.online',
  FRONTEND_URLS: 'https://matrixapi.online,https://www.matrixapi.online',
  ZPAY_PID: '1234567890123456',
  ZPAY_KEY: 'zpay-live-key-1234567890',
  ZPAY_NOTIFY_URL: 'https://matrixapi.online/api/wallet/zpay/notify',
  ZPAY_RETURN_URL: 'https://matrixapi.online/dashboard/balance',
};

validateProductionEnv(validEnv);

assert.doesNotThrow(() => validateProductionEnv({ NODE_ENV: 'development' }));
assert.throws(
  () => validateProductionEnv({ ...validEnv, JWT_SECRET: 'short' }),
  /JWT_SECRET must be at least 32 characters/,
);
assert.throws(
  () => validateProductionEnv({ ...validEnv, ZPAY_KEY: 'change-me' }),
  /ZPAY_KEY contains a placeholder value/,
);
assert.throws(
  () => validateProductionEnv({ ...validEnv, API_PUBLIC_URL: 'matrixapi.online/api' }),
  /API_PUBLIC_URL must start with http:\/\/ or https:\/\//,
);
assert.throws(
  () => validateProductionEnv({ ...validEnv, FRONTEND_URLS: 'https://matrixapi.online,matrixapi.online' }),
  /FRONTEND_URLS must start with http:\/\/ or https:\/\//,
);
assert.throws(
  () => validateProductionEnv({ ...validEnv, ALLOW_FALLBACK_MODELS: 'true' }),
  /ALLOW_FALLBACK_MODELS must not be true in production/,
);

console.log('production env validation test passed');
