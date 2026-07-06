import assert from 'node:assert/strict';
import { AuthService } from './auth.service';

function createPrismaMock() {
  const state: any = {
    users: [],
    commissions: [],
    walletLogs: [],
  };

  const prisma = {
    state,
    user: {
      findFirst: async (args: any) => {
        if (args?.where?.username) {
          return state.users.find((user: any) => user.username === args.where.username) || null;
        }
        if (args?.where?.inviteCode) {
          return state.users.find((user: any) => user.inviteCode === args.where.inviteCode) || null;
        }
        return null;
      },
      create: async (args: any) => {
        const user = {
          id: `user-${state.users.length + 1}`,
          username: args.data.username,
          passwordHash: args.data.passwordHash,
          inviteCode: args.data.inviteCode,
          inviteBy: args.data.inviteBy,
          balance: args.data.balance ?? 0,
          role: 'USER',
          status: 'ACTIVE',
        };
        state.users.push(user);
        return user;
      },
      update: async (args: any) => {
        const user = state.users.find((item: any) => item.id === args.where.id);
        if (args.data.balance?.increment) {
          user.balance += args.data.balance.increment;
        } else {
          Object.assign(user, args.data);
        }
        return user;
      },
    },
    commission: {
      create: async (args: any) => {
        state.commissions.push(args.data);
        return args.data;
      },
    },
    walletLog: {
      create: async (args: any) => {
        state.walletLogs.push(args.data);
        return args.data;
      },
    },
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
  prisma.state.users.push({
    id: 'referrer-1',
    username: 'inviter',
    inviteCode: 'INVITER01',
    balance: 20,
    role: 'USER',
    status: 'ACTIVE',
  });

  const jwtService = {
    sign: () => 'token',
  } as any;

  const service = new AuthService(prisma, jwtService);

  const result = await service.register({
    username: 'new-user',
    password: 'password123',
    inviteCode: 'INVITER01',
  } as any);

  assert.equal(result.user.username, 'new-user');
  const referrer = prisma.state.users.find((user: any) => user.id === 'referrer-1');
  const invited = prisma.state.users.find((user: any) => user.username === 'new-user');
  assert.equal(referrer.balance, 25);
  assert.equal(invited.balance, 5);
  assert.equal(prisma.state.commissions.length, 1);
  assert.equal(prisma.state.commissions[0].amount, 5);
  assert.equal(prisma.state.walletLogs.length, 2);

  await assert.rejects(
    () => service.register({
      username: 'bad-invite-user',
      password: 'password123',
      inviteCode: 'NO_SUCH_CODE',
    } as any),
    /Invalid invite code/,
  );
  assert.equal(prisma.state.users.some((user: any) => user.username === 'bad-invite-user'), false);

  console.log('auth service invite bonus test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
