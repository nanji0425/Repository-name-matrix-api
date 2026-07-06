import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  fetchUpstreamModels,
  syncUpstreamModels as persistUpstreamModels,
  UPSTREAM_PROVIDER_ID,
} from '../../../prisma/model-sync';

@Injectable()
export class ModelSyncService implements OnModuleInit {
  private readonly logger = new Logger(ModelSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    void this.syncUpstreamModels('startup');
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncScheduled() {
    await this.syncUpstreamModels('scheduled');
  }

  async syncNow() {
    return this.syncUpstreamModels('manual');
  }

  async syncUpstreamModels(reason: 'startup' | 'scheduled' | 'manual') {
    if (process.env.DISABLE_MODEL_SYNC === 'true') {
      this.logger.warn(`Model sync skipped (${reason}): DISABLE_MODEL_SYNC=true`);
      return { synced: 0, reason, skipped: true };
    }

    const configuredApiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY;
    if (!configuredApiKey) {
      this.logger.warn(`Model sync skipped (${reason}): missing UPSTREAM_API_KEY`);
      return { synced: 0, reason, skipped: true };
    }

    const provider = await this.prisma.provider.upsert({
      where: { id: UPSTREAM_PROVIDER_ID },
      update: {
        name: 'bblabu',
        baseUrl: process.env.UPSTREAM_BASE_URL || 'https://api.bblabu.cn/v1',
        apiKey: configuredApiKey,
        priority: 1,
        status: 'ACTIVE',
      },
      create: {
        id: UPSTREAM_PROVIDER_ID,
        name: 'bblabu',
        baseUrl: process.env.UPSTREAM_BASE_URL || 'https://api.bblabu.cn/v1',
        apiKey: configuredApiKey,
        priority: 1,
        status: 'ACTIVE',
      },
    });
    const baseUrl = process.env.UPSTREAM_BASE_URL || provider.baseUrl;
    const apiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY || provider.apiKey;

    if (!apiKey) {
      this.logger.warn(`Model sync skipped (${reason}): missing upstream API key`);
      return { synced: 0, reason, skipped: true };
    }

    try {
      const payload = await fetchUpstreamModels(baseUrl, apiKey);
      const models = await persistUpstreamModels(this.prisma, payload, UPSTREAM_PROVIDER_ID);
      this.logger.log(`Synced ${models.length} upstream models (${reason})`);
      return { synced: models.length, reason, skipped: false };
    } catch (error: any) {
      this.logger.warn(`Model sync failed (${reason}): ${error?.message || error}`);
      return { synced: 0, reason, skipped: true, error: error?.message || String(error) };
    }
  }
}
