import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List commissions for the current user (as the commission recipient).
   */
  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.commission.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          inviteUser: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * List commissions where the current user was the invitee (referred by others).
   */
  async findByInviteUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.commission.findMany({
        where: { inviteUserId: userId },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where: { inviteUserId: userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get total earned commissions for a user.
   */
  async getTotalEarned(userId: string) {
    const result = await this.prisma.commission.aggregate({
      where: { userId, status: 'SETTLED' },
      _sum: { amount: true },
    });

    return { totalEarned: result._sum.amount ?? 0 };
  }
}
