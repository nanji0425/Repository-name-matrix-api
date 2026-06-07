import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a random API key secret with 'sk-' prefix.
   */
  private generateSecret(): string {
    const key = randomBytes(32).toString('hex');
    return `sk-${key}`;
  }

  /**
   * List all API keys belonging to a user.
   */
  async findAllByUser(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        secret: true,
        status: true,
        quota: true,
        usedAmount: true,
        requestCount: true,
        expiresAt: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new API key for a user.
   */
  async create(userId: string, dto: CreateApiKeyDto) {
    const secret = this.generateSecret();

    return this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        secret,
        quota: dto.quota ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        secret: true,
        status: true,
        quota: true,
        usedAmount: true,
        requestCount: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Delete an API key, ensuring it belongs to the user.
   */
  async delete(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenException('You do not own this API key');
    }

    await this.prisma.apiKey.delete({ where: { id } });

    return { message: 'API key deleted successfully' };
  }

  /**
   * Toggle an API key status (ACTIVE <-> DISABLED), ensuring it belongs to the user.
   */
  async toggleStatus(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenException('You do not own this API key');
    }

    const newStatus = apiKey.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        secret: true,
        status: true,
        quota: true,
        usedAmount: true,
        requestCount: true,
        expiresAt: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    return updated;
  }
}
