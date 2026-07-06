import assert from 'node:assert/strict';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';

function runSeed(env: Record<string, string>): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['-r', 'ts-node/register', 'prisma/seed.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      DATABASE_URL: 'postgresql://matrixapi:matrixapi_dev_password@localhost:5432/matrix_api?schema=public',
    },
    encoding: 'utf8',
  });
}

const missingAdminPassword = runSeed({ ADMIN_PASSWORD: '' });
assert.notEqual(missingAdminPassword.status, 0);
assert.match(`${missingAdminPassword.stdout}\n${missingAdminPassword.stderr}`, /ADMIN_PASSWORD must be set/);

const demoWithoutPassword = runSeed({
  ADMIN_PASSWORD: 'strong-admin-password',
  UPSTREAM_API_KEY: 'sk-test-upstream',
  ENABLE_DEMO_DATA: 'true',
  DEMO_PASSWORD: '',
});
assert.notEqual(demoWithoutPassword.status, 0);
assert.match(`${demoWithoutPassword.stdout}\n${demoWithoutPassword.stderr}`, /DEMO_PASSWORD must be set/);

const missingUpstreamKey = runSeed({
  ADMIN_PASSWORD: 'strong-admin-password',
  UPSTREAM_API_KEY: '',
  OPENAI_API_KEY: '',
});
assert.notEqual(missingUpstreamKey.status, 0);
assert.match(`${missingUpstreamKey.stdout}\n${missingUpstreamKey.stderr}`, /UPSTREAM_API_KEY must be set/);

const upstreamSyncFailure = runSeed({
  ADMIN_PASSWORD: 'strong-admin-password',
  UPSTREAM_API_KEY: 'sk-test-upstream-key-123456',
  OPENAI_API_KEY: '',
  UPSTREAM_BASE_URL: 'http://127.0.0.1:1/v1',
});
assert.notEqual(upstreamSyncFailure.status, 0);
assert.match(`${upstreamSyncFailure.stdout}\n${upstreamSyncFailure.stderr}`, /Upstream model sync failed/);

console.log('seed security test passed');
