import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@Injectable()
export class ModelsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all active models (public-facing).
   */
  async findAllActive() {
    return this.prisma.model.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ inputPrice: { gt: 0 } }, { outputPrice: { gt: 0 } }],
      },
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * List all models including inactive (admin).
   */
  async findAll() {
    return this.prisma.model.findMany({
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single model by ID.
   */
  async findById(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  /**
   * Create a new model linked to a provider.
   */
  async create(dto: CreateModelDto) {
    // Verify the provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new BadRequestException('Provider not found');
    }

    return this.prisma.model.create({
      data: {
        name: dto.name,
        modelCode: dto.modelCode,
        providerId: dto.providerId,
        inputPrice: dto.inputPrice,
        outputPrice: dto.outputPrice,
        multiplier: dto.multiplier ?? 1.0,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Update an existing model.
   */
  async update(id: string, dto: UpdateModelDto) {
    const model = await this.prisma.model.findUnique({ where: { id } });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    // If providerId is being changed, verify the new provider exists
    if (dto.providerId) {
      const provider = await this.prisma.provider.findUnique({
        where: { id: dto.providerId },
      });

      if (!provider) {
        throw new BadRequestException('Provider not found');
      }
    }

    return this.prisma.model.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.modelCode !== undefined && { modelCode: dto.modelCode }),
        ...(dto.providerId !== undefined && { providerId: dto.providerId }),
        ...(dto.inputPrice !== undefined && { inputPrice: dto.inputPrice }),
        ...(dto.outputPrice !== undefined && { outputPrice: dto.outputPrice }),
        ...(dto.multiplier !== undefined && { multiplier: dto.multiplier }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Toggle model status between ACTIVE and INACTIVE.
   */
  async toggleStatus(id: string) {
    const model = await this.prisma.model.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Model not found');

    const newStatus = model.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.model.update({
      where: { id },
      data: { status: newStatus },
      include: {
        provider: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a model by ID.
   */
  async delete(id: string) {
    const model = await this.prisma.model.findUnique({ where: { id } });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    await this.prisma.model.delete({ where: { id } });

    return { message: 'Model deleted successfully' };
  }
}
