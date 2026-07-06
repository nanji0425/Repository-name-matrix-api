import assert from 'node:assert/strict';
import { WalletService } from './wallet.service';
import { signZpayParams } from './zpay';

function createPrismaMock() {
  const prisma: any = {
    user: {
      findUnique: async () => null,
      update: async () => null,
    },
    order: {
      findUnique: async () => null,
      update: async () => null,
      updateMany: async () => ({ count: 0 }),
      create: async () => null,
    },
    walletLog: {
      create: async () => null,
      findMany: async () => [],
      count: async () => 0,
    },
  };

  prisma.$transaction = async (operations: Array<Promise<unknown>> | ((tx: any) => Promise<unknown>)) => {
    if (typeof operations === 'function') return operations(prisma);
    return Promise.all(operations);
  };

  return prisma;
}

async function run() {
  process.env.ZPAY_KEY = 'test-secret';

  const prisma = createPrismaMock();
  const service = new WalletService(prisma);

  let updatedUserBalance = 100;
  const calls = {
    orderUpdateMany: [] as any[],
    userUpdate: [] as any[],
    walletLogCreate: [] as any[],
  };

  prisma.order.findUnique = async () => ({
    id: 'order-1',
    orderNo: 'RE123',
    amount: 50,
    payType: 'QRPAY',
    status: 'PENDING',
    userId: 'user-1',
    user: { id: 'user-1', balance: updatedUserBalance },
  });
  prisma.order.updateMany = async (args: any) => {
    calls.orderUpdateMany.push(args);
    return { count: 1 };
  };
  prisma.user.update = async (args: any) => {
    calls.userUpdate.push(args);
    updatedUserBalance += args.data.balance.increment;
    return { id: args.where.id, balance: updatedUserBalance };
  };
  prisma.walletLog.create = async (args: any) => {
    calls.walletLogCreate.push(args);
    return args;
  };

  const result = await service.confirmPayment('RE123');

  assert.deepEqual(result, { message: 'Payment confirmed successfully', orderNo: 'RE123' });
  assert.equal(updatedUserBalance, 150);
  assert.deepEqual(calls.orderUpdateMany[0], {
    where: { id: 'order-1', status: 'PENDING' },
    data: { status: 'COMPLETED' },
  });
  assert.deepEqual(calls.userUpdate[0], {
    where: { id: 'user-1' },
    data: { balance: { increment: 50 } },
    select: { balance: true },
  });
  assert.deepEqual(calls.walletLogCreate[0], {
    data: {
      userId: 'user-1',
      type: 'RECHARGE',
      amount: 50,
      balance: 150,
      remark: 'Recharge via QRPAY (RE123)',
    },
  });

  prisma.order.updateMany = async () => ({ count: 0 });
  await assert.rejects(
    () => service.confirmPayment('RE123'),
    /Order already processed/,
  );

  const notifyPrisma = createPrismaMock();
  const notifyService = new WalletService(notifyPrisma);
  let notifyBalance = 25;
  let notifyStatus = 'PENDING';
  const notifyCalls = {
    userUpdates: 0,
    walletLogs: 0,
  };

  notifyPrisma.order.findUnique = async () => ({
    id: 'order-2',
    orderNo: 'RE456',
    amount: 30,
    payType: 'ALIPAY',
    status: notifyStatus,
    userId: 'user-2',
  });
  notifyPrisma.order.updateMany = async (args: any) => {
    if (args.where.status === 'PENDING' && notifyStatus === 'PENDING') {
      notifyStatus = 'COMPLETED';
      return { count: 1 };
    }
    return { count: 0 };
  };
  notifyPrisma.user.update = async (args: any) => {
    notifyCalls.userUpdates += 1;
    notifyBalance += args.data.balance.increment;
    return { balance: notifyBalance };
  };
  notifyPrisma.walletLog.create = async () => {
    notifyCalls.walletLogs += 1;
  };

  const notifyParams: Record<string, string> = {
    pid: '1001',
    type: 'alipay',
    out_trade_no: 'RE456',
    trade_no: 'ZPAY789',
    trade_status: 'TRADE_SUCCESS',
    name: 'MatrixAPI recharge RE456',
    money: '30.00',
  };
  const validNotify = {
    ...notifyParams,
    sign: signZpayParams(notifyParams, 'test-secret'),
    sign_type: 'MD5',
  };

  assert.equal(await notifyService.handleZpayNotify(validNotify), true);
  assert.equal(notifyBalance, 55);
  assert.equal(notifyCalls.userUpdates, 1);
  assert.equal(notifyCalls.walletLogs, 1);

  assert.equal(await notifyService.handleZpayNotify(validNotify), true);
  assert.equal(notifyCalls.userUpdates, 1);
  assert.equal(notifyCalls.walletLogs, 1);

  assert.equal(await notifyService.handleZpayNotify({ ...validNotify, sign: 'bad-sign' }), false);
  assert.equal(
    await notifyService.handleZpayNotify({
      ...validNotify,
      money: '31.00',
      sign: signZpayParams({ ...notifyParams, money: '31.00' }, 'test-secret'),
    }),
    false,
  );

  process.env.FRONTEND_URL = '';
  process.env.API_PUBLIC_URL = '';
  process.env.NEXT_PUBLIC_API_URL = '';
  process.env.ZPAY_NOTIFY_URL = '';
  process.env.ZPAY_RETURN_URL = '';
  const defaultUrlService = new WalletService(createPrismaMock());
  const rechargeConfig = await defaultUrlService.getRechargeConfig();
  assert.equal(rechargeConfig.gateway, 'https://zpayz.cn/');

  console.log('wallet-service confirmPayment test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
