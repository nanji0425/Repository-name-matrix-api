import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all providers, ordered by priority (ascending).
   */
  async findAll() {
    return this.prisma.provider.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single provider by ID.
   */
  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        models: {
          select: { id: true, name: true, modelCode: true, status: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Create a new provider.
   */
  async create(dto: CreateProviderDto) {
    return this.prisma.provider.create({
      data: {
        name: dto.name,
        baseUrl: dto.baseUrl,
        apiKey: dto.apiKey,
        priority: dto.priority ?? 10,
      },
    });
  }

  /**
   * Update an existing provider.
   */
  async update(id: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.provider.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.baseUrl !== undefined && { baseUrl: dto.baseUrl }),
        ...(dto.apiKey !== undefined && { apiKey: dto.apiKey }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
    });
  }

  /**
   * Toggle provider status between ACTIVE and INACTIVE.
   */
  async toggleStatus(id: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');

    const newStatus = provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.provider.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Delete a provider by ID.
   */
  async delete(id: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    await this.prisma.provider.delete({ where: { id } });

    return { message: 'Provider deleted successfully' };
  }
}
