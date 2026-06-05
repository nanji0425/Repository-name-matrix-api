import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetRateDto } from './dto/set-rate.dto';

@Injectable()
export class DynamicRateService {
  private readonly DEFAULT_RATE = 1.0;
  private readonly DEFAULT_CAP = 1.0;

  constructor(private prisma: PrismaService) {}

  /**
   * Get the current dynamic rate. Returns the latest rate entry,
   * or default values if none exists.
   */
  async getCurrentRate() {
    const rate = await this.prisma.dynamicRate.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!rate) {
      return {
        rate: this.DEFAULT_RATE,
        cap: this.DEFAULT_CAP,
      };
    }

    return {
      id: rate.id,
      rate: rate.rate,
      cap: rate.cap,
      updatedAt: rate.updatedAt,
      createdAt: rate.createdAt,
    };
  }

  /**
   * Set a new dynamic rate (creates a new record for history tracking).
   */
  async setRate(dto: SetRateDto) {
    return this.prisma.dynamicRate.create({
      data: {
        rate: dto.rate,
        cap: dto.cap,
      },
    });
  }

  /**
   * Get rate history for the last N days for trend charts.
   */
  async getRateHistory(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rates = await this.prisma.dynamicRate.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rates.map((r) => ({
      id: r.id,
      rate: r.rate,
      cap: r.cap,
      createdAt: r.createdAt,
    }));
  }
}
