import assert from 'node:assert/strict';
import { AdminService } from './admin.service';

function createPrismaMock() {
  const apiKeyState = { status: 'ACTIVE', deleted: false };
  return {
    user: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        const role = args?.where?.role;
        if (status === 'ACTIVE') return 18;
        if (status === 'DISABLED') return 2;
        if (role === 'ADMIN') return 1;
        return 20;
      },
    },
    apiKey: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        if (status === 'ACTIVE') return 34;
        if (status === 'DISABLED') return 6;
        return 40;
      },
      findUnique: async (args: any) => {
        if (args.where.id !== 'key-1' || apiKeyState.deleted) return null;
        return { id: 'key-1', name: 'Production Key', status: apiKeyState.status };
      },
      update: async (args: any) => {
        apiKeyState.status = args.data.status;
        return { id: args.where.id, name: 'Production Key', status: apiKeyState.status, updatedAt: new Date('2026-01-01T00:00:00Z') };
      },
      delete: async (args: any) => {
        apiKeyState.deleted = true;
        return { id: args.where.id };
      },
    },
    model: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        if (status === 'ACTIVE') return 26;
        if (status === 'DISABLED') return 4;
        return 30;
      },
    },
    provider: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        if (status === 'ACTIVE') return 8;
        if (status === 'DISABLED') return 1;
        return 9;
      },
    },
    order: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        if (status === 'COMPLETED') return 120;
        if (status === 'PENDING') return 11;
        if (status === 'FAILED') return 4;
        return 135;
      },
      aggregate: async () => ({ _sum: { amount: 4821.35 } }),
    },
    walletLog: {
      aggregate: async () => ({ _sum: { amount: 2100.5 } }),
    },
    requestLog: {
      count: async (args?: any) => {
        const status = args?.where?.status;
        if (status === 200) return 9800;
        if (status === 500) return 22;
        return 9822;
      },
      aggregate: async () => ({
        _sum: { promptTokens: 128000, completionTokens: 256000, cost: 319.88 },
        _avg: { latency: 186 },
      }),
    },
    commission: {
      count: async () => 14,
      findMany: async () => [
        {
          id: 'commission-1',
          userId: 'user-1',
          inviteUserId: 'user-2',
          amount: 5,
          status: 'PENDING',
        },
      ],
      aggregate: async () => ({ _sum: { amount: 65 } }),
    },
    team: {
      count: async () => 3,
    },
    teamMember: {
      count: async () => 12,
    },
    announcement: {
      count: async () => 5,
    },
  } as any;
}

async function run() {
  const service = new AdminService(createPrismaMock());
  const stats = await service.getStats();

  assert.equal(stats.users.total, 20);
  assert.equal(stats.users.active, 18);
  assert.equal(stats.users.disabled, 2);
  assert.equal(stats.users.admins, 1);
  assert.equal(stats.apiKeys.total, 40);
  assert.equal(stats.orders.completed, 120);
  assert.equal(stats.orders.revenue, 4821.35);
  assert.equal(stats.wallet.totalRecharge, 2100.5);
  assert.equal(stats.requests.totalTokens, 384000);
  assert.equal(stats.commissions.amount, 65);
  assert.equal(stats.teams.members, 12);
  assert.equal(stats.announcements, 5);
  assert.equal(stats.site.status, 'ONLINE');
  assert.equal(stats.site.environment, process.env.NODE_ENV || 'development');
  assert.equal(typeof stats.site.checkedAt, 'string');
  assert.equal(stats.site.management.users, true);
  assert.equal(stats.site.management.settings, true);

  const commissions = await service.listAllCommissions(1, 20, 'PENDING');
  assert.equal(commissions.total, 14);
  assert.equal(commissions.data[0].id, 'commission-1');

  const disabledKey = await service.toggleApiKeyStatus('key-1');
  assert.equal(disabledKey.status, 'DISABLED');

  const deleted = await service.deleteApiKey('key-1');
  assert.deepEqual(deleted, { message: 'API key deleted successfully' });

  await assert.rejects(() => service.toggleApiKeyStatus('key-1'), /API key not found/);

  console.log('admin service stats coverage test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
