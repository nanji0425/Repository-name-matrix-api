import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getJwtSecret } from './jwt-secret';

const originalSecret = process.env.JWT_SECRET;

process.env.JWT_SECRET = '';
assert.throws(() => getJwtSecret(), /JWT_SECRET must be set/);

process.env.JWT_SECRET = 'short';
assert.throws(() => getJwtSecret(), /JWT_SECRET must be set/);

process.env.JWT_SECRET = 'a'.repeat(32);
assert.equal(getJwtSecret(), 'a'.repeat(32));

if (originalSecret === undefined) {
  delete process.env.JWT_SECRET;
} else {
  process.env.JWT_SECRET = originalSecret;
}

for (const file of ['auth.module.ts', 'jwt.strategy.ts']) {
  const source = readFileSync(join(__dirname, file), 'utf8');
  assert.equal(source.includes('matrix-api-secret'), false, `${file} must not contain a default JWT secret`);
}

console.log('jwt secret security test passed');
