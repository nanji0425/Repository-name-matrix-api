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
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      adminUsers,
      totalApiKeys,
      activeApiKeys,
      disabledApiKeys,
      totalModels,
      activeModels,
      disabledModels,
      totalProviders,
      activeProviders,
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      totalRevenue,
      walletLogs,
      requestTotal,
      requestSuccess,
      requestMetrics,
      totalCommissions,
      commissionMetrics,
      totalTeams,
      totalTeamMembers,
      totalAnnouncements,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'DISABLED' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.apiKey.count(),
      this.prisma.apiKey.count({ where: { status: 'ACTIVE' } }),
      this.prisma.apiKey.count({ where: { status: 'DISABLED' } }),
      this.prisma.model.count(),
      this.prisma.model.count({ where: { status: 'ACTIVE' } }),
      this.prisma.model.count({ where: { status: 'DISABLED' } }),
      this.prisma.provider.count(),
      this.prisma.provider.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'FAILED' } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.walletLog.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.requestLog.count(),
      this.prisma.requestLog.count({ where: { status: 200 } }),
      this.prisma.requestLog.aggregate({
        _sum: { promptTokens: true, completionTokens: true, cost: true },
        _avg: { latency: true },
      }),
      this.prisma.commission.count(),
      this.prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.team.count(),
      this.prisma.teamMember.count(),
      this.prisma.announcement.count(),
    ]);

    const revenue = totalRevenue._sum.amount || 0;
    const walletAmount = walletLogs._sum.amount || 0;
    const promptTokens = requestMetrics._sum.promptTokens || 0;
    const completionTokens = requestMetrics._sum.completionTokens || 0;
    const requestCost = requestMetrics._sum.cost || 0;
    const avgLatency = requestMetrics._avg.latency || 0;
    const commissionAmount = commissionMetrics._sum.amount || 0;
    const requestFailed = Math.max(requestTotal - requestSuccess, 0);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        disabled: disabledUsers,
        admins: adminUsers,
      },
      apiKeys: {
        total: totalApiKeys,
        active: activeApiKeys,
        disabled: disabledApiKeys,
      },
      models: {
        total: totalModels,
        active: activeModels,
        disabled: disabledModels,
      },
      providers: {
        total: totalProviders,
        active: activeProviders,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        failed: failedOrders,
        revenue,
      },
      wallet: {
        totalRecharge: walletAmount,
      },
      requests: {
        total: requestTotal,
        success: requestSuccess,
        failed: requestFailed,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost: requestCost,
        avgLatency,
      },
      commissions: {
        total: totalCommissions,
        amount: commissionAmount,
      },
      teams: {
        total: totalTeams,
        members: totalTeamMembers,
      },
      announcements: totalAnnouncements,
      legacy: {
        users: totalUsers,
        orders: completedOrders,
        revenue,
        models: activeModels,
        totalRequests: requestTotal,
      },
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

  async listAllCommissions(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
          inviteUser: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleApiKeyStatus(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('API key not found');

    const newStatus = apiKey.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    return this.prisma.apiKey.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async deleteApiKey(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API key deleted successfully' };
  }
}
