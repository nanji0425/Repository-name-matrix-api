import assert from 'node:assert/strict';
import { ApiKeysService } from './api-keys.service';

function createPrismaMock() {
  return {
    apiKey: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (args: any) => args,
      update: async (args: any) => args,
      delete: async () => null,
    },
  } as any;
}

async function run() {
  const prisma = createPrismaMock();
  const service = new ApiKeysService(prisma);

  let createdArgs: any = null;
  prisma.apiKey.create = async (args: any) => {
    createdArgs = args;
    return {
      id: 'key-1',
      name: args.data.name,
      secret: args.data.secret,
      status: 'ACTIVE',
      quota: args.data.quota,
      usedAmount: 0,
      requestCount: 0,
      expiresAt: args.data.expiresAt,
      allowedModels: args.data.allowedModels,
      createdAt: new Date('2026-06-07T00:00:00.000Z'),
    };
  };

  const result = await service.create('user-1', {
    name: '生产密钥',
    allowedModelCodes: ['gpt-4o-mini', 'deepseek-chat'],
  } as any);

  assert.equal(result.name, '生产密钥');
  assert.deepEqual(createdArgs.data.allowedModels, ['gpt-4o-mini', 'deepseek-chat']);
  assert.deepEqual((result as any).allowedModels, ['gpt-4o-mini', 'deepseek-chat']);

  console.log('api-keys service create allowed models test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
