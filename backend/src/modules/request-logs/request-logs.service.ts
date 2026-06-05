import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequestLogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List request logs for the current user with pagination, search, and filters.
   */
  async findByUser(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      modelId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    // Filter by model
    if (params.modelId) {
      where.modelId = params.modelId;
    }

    // Filter by status (HTTP status code)
    if (params.status) {
      const statusCode = parseInt(params.status, 10);
      if (!isNaN(statusCode)) {
        where.status = statusCode;
      }
    }

    // Filter by date range
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    // Full-text search across model name via relation
    if (params.search) {
      where.OR = [
        {
          model: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          apiKey: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.requestLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          model: {
            select: { id: true, name: true, modelCode: true },
          },
          apiKey: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.requestLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get usage statistics for the current user.
   */
  async getStats(userId: string) {
    const result = await this.prisma.requestLog.aggregate({
      where: { userId },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        cost: true,
      },
      _count: true,
    });

    return {
      totalRequests: result._count,
      totalPromptTokens: result._sum.promptTokens ?? 0,
      totalCompletionTokens: result._sum.completionTokens ?? 0,
      totalCost: result._sum.cost ?? 0,
    };
  }
}
