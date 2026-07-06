import assert from 'node:assert/strict';
import { OrdersService } from './orders.service';

async function run() {
  const calls = {
    confirmPayment: [] as string[],
    orderUpdates: [] as any[],
    findMany: [] as any[],
    count: [] as any[],
  };

  const prisma: any = {
    order: {
      findMany: async (args: any) => {
        calls.findMany.push(args);
        return [];
      },
      count: async (args: any) => {
        calls.count.push(args);
        return 0;
      },
      findUnique: async () => ({ id: 'order-1', orderNo: 'RE123', status: 'PENDING' }),
      update: async (args: any) => {
        calls.orderUpdates.push(args);
        return { id: args.where.id, status: args.data.status };
      },
    },
  };

  const walletService: any = {
    confirmPayment: async (orderNo: string) => {
      calls.confirmPayment.push(orderNo);
      return { message: 'Payment confirmed successfully', orderNo };
    },
  };

  const service = new OrdersService(prisma, walletService);
  await service.findAll(2, 10, {
    status: 'PENDING',
    payType: 'WECHAT',
    startDate: '2026-07-01',
    endDate: '2026-07-06',
  });
  assert.deepEqual(calls.findMany[0].where, {
    status: 'PENDING',
    payType: 'WECHAT',
    createdAt: {
      gte: new Date('2026-07-01T00:00:00.000Z'),
      lte: new Date('2026-07-06T23:59:59.999Z'),
    },
  });
  assert.deepEqual(calls.count[0].where, calls.findMany[0].where);

  const completed = await service.updateStatus('order-1', 'COMPLETED');
  assert.deepEqual(completed, { message: 'Payment confirmed successfully', orderNo: 'RE123' });
  assert.deepEqual(calls.confirmPayment, ['RE123']);
  assert.equal(calls.orderUpdates.length, 0);

  const failed = await service.updateStatus('order-1', 'FAILED');
  assert.deepEqual(failed, { id: 'order-1', status: 'FAILED' });
  assert.deepEqual(calls.orderUpdates[0], {
    where: { id: 'order-1' },
    data: { status: 'FAILED' },
  });

  prisma.order.findUnique = async () => ({ id: 'order-2', orderNo: 'RE456', status: 'COMPLETED' });
  await assert.rejects(
    () => service.updateStatus('order-2', 'PENDING'),
    /Completed orders cannot be moved back/,
  );

  console.log('orders service status transition test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
