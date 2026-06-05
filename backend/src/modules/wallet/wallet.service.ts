import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RechargeDto } from './dto/recharge.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Get the current balance for a user.
   */
  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { balance: user.balance };
  }

  /**
   * Get wallet logs for a user with pagination.
   */
  async getLogs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.walletLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletLog.count({ where: { userId } }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Handle a payment callback/confirmation for an order.
   * Marks the order COMPLETED and adds the amount to the user's wallet.
   */
  async confirmPayment(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Order already processed (status: ${order.status})`);
    }

    const newBalance = order.user.balance + order.amount;

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      }),
      this.prisma.user.update({
        where: { id: order.userId },
        data: { balance: newBalance },
      }),
      this.prisma.walletLog.create({
        data: {
          userId: order.userId,
          type: 'RECHARGE',
          amount: order.amount,
          balance: newBalance,
          remark: `Recharge via ${order.payType} (${order.orderNo})`,
        },
      }),
    ]);

    this.logger.log(`Payment confirmed: ${orderNo}, amount: ${order.amount}`);
    return { message: 'Payment confirmed successfully', orderNo };
  }

  /**
   * Create a recharge order.
   */
  async createRechargeOrder(userId: string, dto: RechargeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate a unique order number
    const orderNo = `RE${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;

    return this.prisma.order.create({
      data: {
        userId,
        orderNo,
        amount: dto.amount,
        payType: dto.payType,
        status: 'PENDING',
      },
      select: {
        id: true,
        orderNo: true,
        amount: true,
        payType: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
