import assert from 'node:assert/strict';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';

function createPrismaMock() {
  const state: any = {
    passwordHash: '',
    updatedPasswordHash: '',
  };

  const prisma = {
    state,
    user: {
      findUnique: async (args: any) => {
        if (args.where.id !== 'user-1') return null;
        return { id: 'user-1', passwordHash: state.passwordHash };
      },
      update: async (args: any) => {
        state.updatedPasswordHash = args.data.passwordHash;
        return { id: args.where.id };
      },
    },
  } as any;

  return prisma;
}

async function run() {
  const prisma = createPrismaMock();
  prisma.state.passwordHash = await bcrypt.hash('old-password', 10);
  const service = new UsersService(prisma);

  await assert.rejects(
    () => service.changePassword('missing-user', {
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
    }),
    /User not found/,
  );

  await assert.rejects(
    () => service.changePassword('user-1', {
      currentPassword: 'wrong-password',
      newPassword: 'new-password-123',
    }),
    /Current password is incorrect/,
  );

  await assert.rejects(
    () => service.changePassword('user-1', {
      currentPassword: 'old-password',
      newPassword: 'short',
    }),
    /at least 8 characters/,
  );

  const result = await service.changePassword('user-1', {
    currentPassword: 'old-password',
    newPassword: 'new-password-123',
  });

  assert.deepEqual(result, { message: 'Password changed successfully' });
  assert.equal(await bcrypt.compare('new-password-123', prisma.state.updatedPasswordHash), true);
  assert.equal(await bcrypt.compare('old-password', prisma.state.updatedPasswordHash), false);

  console.log('users service password change test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
