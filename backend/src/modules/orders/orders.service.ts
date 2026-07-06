import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  /**
   * List orders for a specific user.
   */
  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * List all orders (admin).
   */
  async findAll(
    page = 1,
    limit = 20,
    filters: { status?: string; payType?: string; startDate?: string; endDate?: string } = {},
  ) {
    const skip = (page - 1) * limit;
    const where = this.buildOrderWhere(filters);

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private buildOrderWhere(filters: { status?: string; payType?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.payType) where.payType = filters.payType;

    const createdAt: any = {};
    if (filters.startDate) {
      const start = new Date(`${filters.startDate}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) createdAt.gte = start;
    }
    if (filters.endDate) {
      const end = new Date(`${filters.endDate}T23:59:59.999Z`);
      if (!Number.isNaN(end.getTime())) createdAt.lte = end;
    }
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    return where;
  }

  /**
   * Get a single order by ID.
   */
  async findById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({ where });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Update order status.
   */
  async updateStatus(id: string, status: string) {
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (status === 'COMPLETED') {
      return this.walletService.confirmPayment(order.orderNo);
    }

    if (order.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new BadRequestException('Completed orders cannot be moved back; create a refund workflow instead');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
