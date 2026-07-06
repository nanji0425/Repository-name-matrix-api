import {
  Injectable, Logger, UnauthorizedException,
  BadRequestException, HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleRequest(req: Request, res: Response, endpoint: string) {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key. Use Authorization: Bearer sk-...');
    }

    // Validate API Key
    const key = await this.prisma.apiKey.findUnique({
      where: { secret: apiKey },
      include: {
        user: {
          include: { group: true },
        },
      },
    });

    if (!key || key.status === 'DISABLED') {
      throw new UnauthorizedException('Invalid or disabled API key');
    }

    if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('API key has expired');
    }

    if (key.user.status === 'DISABLED') {
      throw new UnauthorizedException('Account is disabled');
    }

    // Get target model
    const body = req.body || {};
    let modelCode = body.model;

    // Find the model
    const model = await this.prisma.model.findFirst({
      where: { modelCode, status: 'ACTIVE' },
      include: { provider: true },
    });

    if (!model) {
      throw new BadRequestException(`Model '${modelCode}' not found or inactive`);
    }

    if (model.provider.status === 'INACTIVE') {
      throw new BadRequestException(`Provider for model '${modelCode}' is inactive`);
    }

    const allowedModels = Array.isArray(key.allowedModels) ? key.allowedModels : [];
    if (allowedModels.length > 0 && !allowedModels.includes(model.modelCode)) {
      throw new BadRequestException(`API key is not allowed to call model '${model.modelCode}'`);
    }

    // Get group multiplier and dynamic rate
    const groupMultiplier = key.user.group?.multiplier ?? 1.0;
    const dynamicRate = await this.getCurrentDynamicRate();

    // Check user balance
    const estimatedTokens = this.estimateTokens(body);
    const estimatedCost = this.calculateCost(model, estimatedTokens.prompt, estimatedTokens.completion, groupMultiplier, dynamicRate);

    if (key.user.balance < estimatedCost) {
      throw new BadRequestException('Insufficient balance');
    }

    if (key.quota !== null && key.usedAmount + estimatedCost > key.quota) {
      throw new BadRequestException('API key quota exceeded');
    }

    // Forward request to provider
    const startTime = Date.now();
    try {
      const result = await this.forwardToProvider(model, body, endpoint);

      // Calculate actual cost
      const promptTokens = result.usage?.prompt_tokens || result.usage?.promptTokens || estimatedTokens.prompt;
      const completionTokens = result.usage?.completion_tokens || result.usage?.completionTokens || estimatedTokens.completion;
      const actualCost = this.calculateCost(model, promptTokens, completionTokens, groupMultiplier, dynamicRate);

      if (key.quota !== null && key.usedAmount + actualCost > key.quota) {
        throw new BadRequestException('API key quota exceeded');
      }

      // Deduct balance, update token statistics and log.
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        const quotaWhere = key.quota === null
          ? [{ quota: null }]
          : [{ quota: null }, { usedAmount: { lte: key.quota - actualCost } }];
        const apiKeyUpdate = await tx.apiKey.updateMany({
          where: {
            id: key.id,
            OR: quotaWhere,
          },
          data: {
            lastUsed: new Date(),
            usedAmount: { increment: actualCost },
            requestCount: { increment: 1 },
          },
        });

        if (apiKeyUpdate.count !== 1) {
          throw new BadRequestException('API key quota exceeded');
        }

        const userUpdate = await tx.user.updateMany({
          where: {
            id: key.user.id,
            balance: { gte: actualCost },
          },
          data: {
            balance: { decrement: actualCost },
          },
        });

        if (userUpdate.count !== 1) {
          throw new BadRequestException('Insufficient balance');
        }

        const user = await tx.user.findUnique({
          where: { id: key.user.id },
          select: { id: true, balance: true },
        });

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        await tx.walletLog.create({
          data: {
            userId: key.user.id,
            type: 'DEDUCTION',
            amount: -actualCost,
            balance: user.balance,
            remark: `API call: ${model.modelCode} (${promptTokens}+${completionTokens} tokens)`,
          },
        });

        return user;
      });
      const newBalance = updatedUser.balance;

      // Log request
      const latency = Date.now() - startTime;
      await this.prisma.requestLog.create({
        data: {
          userId: key.user.id,
          apiKeyId: key.id,
          modelId: model.id,
          promptTokens,
          completionTokens,
          cost: actualCost,
          status: 200,
          latency,
        },
      });

      return res.status(200).json(result);
    } catch (error) {
      const latency = Date.now() - startTime;
      const statusCode = this.getErrorStatusCode(error);

      // Log failed request
      await this.prisma.requestLog.create({
        data: {
          userId: key.user.id,
          apiKeyId: key.id,
          modelId: model.id,
          promptTokens: estimatedTokens.prompt,
          completionTokens: 0,
          cost: 0,
          status: statusCode,
          latency,
        },
      });

      await this.prisma.apiKey.update({
        where: { id: key.id },
        data: {
          lastUsed: new Date(),
          requestCount: { increment: 1 },
        },
      });

      this.logger.error(`Gateway error for ${key.user.username}: ${error.message}`);
      throw new HttpException(
        error.response?.data || error.message || 'Upstream service error',
        statusCode,
      );
    }
  }

  async listModels() {
    const models = await this.prisma.model.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        modelCode: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      object: 'list',
      data: models.map(m => ({
        id: m.modelCode,
        object: 'model',
        created: Math.floor(m.createdAt.getTime() / 1000),
        owned_by: 'matrix-api',
      })),
    };
  }

  private extractApiKey(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    return null;
  }

  private estimateTokens(body: any): { prompt: number; completion: number } {
    const messages = body.messages || [];
    const prompt = messages.reduce((acc: number, m: any) => {
      return acc + (m.content?.length || 0) / 4;
    }, 0);

    const maxTokens = body.max_tokens || 1000;
    return { prompt: Math.ceil(prompt), completion: maxTokens };
  }

  private calculateCost(
    model: any,
    promptTokens: number,
    completionTokens: number,
    groupMultiplier: number = 1.0,
    dynamicRate: number = 1.0,
  ): number {
    const inputCost = (promptTokens / 1000) * model.inputPrice * model.multiplier;
    const outputCost = (completionTokens / 1000) * model.outputPrice * model.multiplier;
    const baseCost = Math.round((inputCost + outputCost) * 1000000) / 1000000;
    return Math.round(baseCost * groupMultiplier * dynamicRate * 1000000) / 1000000;
  }

  private async getCurrentDynamicRate(): Promise<number> {
    try {
      const rate = await this.prisma.dynamicRate.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      return rate?.rate ?? 1.0;
    } catch {
      return 1.0;
    }
  }

  private getErrorStatusCode(error: any): number {
    if (typeof error?.getStatus === 'function') {
      return error.getStatus();
    }
    return error?.response?.status || 500;
  }

  private async forwardToProvider(model: any, body: any, endpoint: string): Promise<any> {
    const provider = model.provider;
    const url = `${provider.baseUrl.replace(/\/$/, '')}/${endpoint}`;

    const { ...forwardBody } = body;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(forwardBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new HttpException(errorBody, response.status);
    }

    return response.json();
  }

}
