import assert from 'node:assert/strict';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

async function run() {
  const okPrisma = {
    $queryRaw: async () => [{ '?column?': 1 }],
  } as any;
  const controller = new HealthController(okPrisma);

  const live = controller.liveness();
  assert.equal(live.status, 'ok');
  assert.equal(live.service, 'matrix-api');

  const ready = await controller.readiness();
  assert.equal(ready.status, 'ready');
  assert.equal(ready.database, 'ok');

  const badController = new HealthController({
    $queryRaw: async () => {
      throw new Error('database down');
    },
  } as any);

  await assert.rejects(
    () => badController.readiness(),
    ServiceUnavailableException,
  );

  console.log('health controller test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
