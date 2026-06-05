import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, email: true, role: true,
          status: true, balance: true, createdAt: true,
          _count: { select: { apiKeys: true, orders: true, requestLogs: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, avatar: true,
        role: true, status: true, balance: true, inviteCode: true,
        createdAt: true, updatedAt: true,
        _count: { select: { apiKeys: true, orders: true, requestLogs: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleUserStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, status: true, updatedAt: true },
    });
  }

  async getStats() {
    const [userCount, orderCount, totalRevenue, modelCount, requestCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.model.count({ where: { status: 'ACTIVE' } }),
      this.prisma.requestLog.count(),
    ]);

    return {
      users: userCount,
      orders: orderCount,
      revenue: totalRevenue._sum.amount || 0,
      models: modelCount,
      totalRequests: requestCount,
    };
  }

  async listAllApiKeys(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiKey.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
