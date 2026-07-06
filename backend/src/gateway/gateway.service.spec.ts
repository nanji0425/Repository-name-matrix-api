import assert from 'node:assert/strict';
import { GatewayService } from './gateway.service';

function createPrismaMock() {
  const state: any = {
    allowedModels: ['other-model'],
    userBalance: 100,
    quota: null,
    usedAmount: 0,
    userUpdateArgs: [] as any[],
  };

  const prisma = {
    state,
    apiKey: {
      findUnique: async () => ({
        id: 'key-1',
        secret: 'sk-test',
        status: 'ACTIVE',
        quota: state.quota,
        usedAmount: state.usedAmount,
        requestCount: 0,
        expiresAt: null,
        allowedModels: state.allowedModels,
        user: {
          id: 'user-1',
          username: 'tester',
          status: 'ACTIVE',
          balance: state.userBalance,
          group: null,
          inviteBy: null,
        },
      }),
      update: async (args: any) => {
        state.apiKeyUpdateArgs = [...(state.apiKeyUpdateArgs || []), args];
        if (args.data.usedAmount?.increment) {
          state.usedAmount += args.data.usedAmount.increment;
        }
        return { id: args.where.id, usedAmount: state.usedAmount };
      },
      updateMany: async (args: any) => {
        state.apiKeyUpdateManyArgs = [...(state.apiKeyUpdateManyArgs || []), args];
        if (state.quota !== null && state.usedAmount + args.data.usedAmount.increment > state.quota) {
          return { count: 0 };
        }
        state.usedAmount += args.data.usedAmount.increment;
        return { count: 1 };
      },
    },
    model: {
      findFirst: async () => ({
        id: 'model-1',
        modelCode: 'gpt-4o-mini',
        inputPrice: 1,
        outputPrice: 1,
        multiplier: 1,
        status: 'ACTIVE',
        provider: {
          status: 'ACTIVE',
          baseUrl: 'https://provider.example.com/v1',
          apiKey: 'provider-key',
        },
      }),
      findMany: async () => [],
    },
    user: {
      update: async (args: any) => {
        state.userUpdateArgs.push(args);
        if (typeof args.data.balance === 'number') {
          state.userBalance = args.data.balance;
        } else if (args.data.balance?.decrement) {
          state.userBalance -= args.data.balance.decrement;
        }
        return { id: args.where.id, balance: state.userBalance };
      },
      updateMany: async (args: any) => {
        state.userUpdateManyArgs = [...(state.userUpdateManyArgs || []), args];
        if (state.userBalance < args.where.balance.gte) {
          return { count: 0 };
        }
        state.userBalance -= args.data.balance.decrement;
        return { count: 1 };
      },
      findUnique: async () => ({ id: 'user-1', balance: state.userBalance }),
      findFirst: async () => null,
    },
    walletLog: {
      create: async (args: any) => {
        state.lastWalletLog = args;
        return args;
      },
    },
    requestLog: {
      create: async (args: any) => {
        state.lastRequestLog = args;
        return args;
      },
    },
    commission: { create: async (args: any) => args },
    dynamicRate: { findFirst: async () => null },
    $transaction: async (operationsOrCallback: Array<Promise<unknown>> | ((tx: any) => Promise<unknown>)) => {
      if (typeof operationsOrCallback === 'function') {
        return operationsOrCallback(prisma);
      }
      return Promise.all(operationsOrCallback);
    },
  } as any;

  return prisma;
}

async function run() {
  const prisma = createPrismaMock();
  const service = new GatewayService(prisma, {} as any);

  const fetchCalls: any[] = [];
  globalThis.fetch = (async (url: string, options: any) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ ok: true }),
    } as any;
  }) as any;

  const req = {
    headers: { authorization: 'Bearer sk-test' },
    body: {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 16,
    },
  } as any;

  const res = {
    statusCode: 0,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  } as any;

  await assert.rejects(
    () => service.handleRequest(req, res, 'chat/completions'),
    /not allowed|forbidden/i,
  );
  assert.equal(fetchCalls.length, 0);

  prisma.state.allowedModels = [];
  prisma.state.quota = null;
  prisma.state.usedAmount = 0;
  prisma.state.userBalance = 100;
  await service.handleRequest(req, res, 'chat/completions');
  assert.deepEqual(prisma.state.apiKeyUpdateManyArgs[0].where, {
    id: 'key-1',
    OR: [{ quota: null }],
  });

  prisma.state.userBalance = 100;
  prisma.state.quota = 1;
  prisma.state.usedAmount = 0;
  await service.handleRequest(req, res, 'chat/completions');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(prisma.state.userUpdateManyArgs[0].where, {
    id: 'user-1',
    balance: { gte: 0.018 },
  });
  assert.equal(prisma.state.userBalance, 99.982);
  assert.equal(prisma.state.lastWalletLog.data.balance, 99.982);
  assert.deepEqual(prisma.state.apiKeyUpdateManyArgs.at(-1).where, {
    id: 'key-1',
    OR: [
      { quota: null },
      { usedAmount: { lte: 0.982 } },
    ],
  });

  prisma.state.quota = 0.01;
  prisma.state.usedAmount = 0;
  await assert.rejects(
    () => service.handleRequest(req, res, 'chat/completions'),
    /quota exceeded/i,
  );

  prisma.state.quota = null;
  prisma.state.usedAmount = 0;
  prisma.state.userBalance = 0.01;
  await assert.rejects(
    () => service.handleRequest(req, res, 'chat/completions'),
    /insufficient balance/i,
  );

  prisma.state.userBalance = 100;

  globalThis.fetch = (async () => ({
    ok: false,
    status: 429,
    text: async () => 'rate limited',
  } as any)) as any;

  await assert.rejects(
    () => service.handleRequest(req, res, 'chat/completions'),
    /rate limited/,
  );
  assert.equal(prisma.state.lastRequestLog.data.status, 429);

  console.log('gateway service tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
