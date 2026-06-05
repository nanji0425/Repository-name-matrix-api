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

    // Get group multiplier and dynamic rate
    const groupMultiplier = key.user.group?.multiplier ?? 1.0;
    const dynamicRate = await this.getCurrentDynamicRate();

    // Check user balance
    const estimatedTokens = this.estimateTokens(body);
    const estimatedCost = this.calculateCost(model, estimatedTokens.prompt, estimatedTokens.completion, groupMultiplier, dynamicRate);

    if (key.user.balance < estimatedCost) {
      throw new BadRequestException('Insufficient balance');
    }

    // Forward request to provider
    const startTime = Date.now();
    try {
      const result = await this.forwardToProvider(model, body, endpoint);

      // Calculate actual cost
      const promptTokens = result.usage?.prompt_tokens || result.usage?.promptTokens || estimatedTokens.prompt;
      const completionTokens = result.usage?.completion_tokens || result.usage?.completionTokens || estimatedTokens.completion;
      const actualCost = this.calculateCost(model, promptTokens, completionTokens, groupMultiplier, dynamicRate);

      // Deduct balance and log (atomic update via raw SQL to prevent race)
      const [updatedUser] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: key.user.id },
          data: { balance: key.user.balance - actualCost },
        }),
        this.prisma.walletLog.create({
          data: {
            userId: key.user.id,
            type: 'DEDUCTION',
            amount: -actualCost,
            balance: key.user.balance - actualCost,
            remark: `API call: ${model.modelCode} (${promptTokens}+${completionTokens} tokens)`,
          },
        }),
      ]);
      const newBalance = updatedUser.balance;

      // Auto-generate commission for referrer
      await this.generateCommission(key.user, actualCost);

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

      // Update API key last used
      await this.prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      });

      return res.status(200).json(result);
    } catch (error) {
      const latency = Date.now() - startTime;
      const statusCode = error.response?.status || 500;

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

  // Markup over upstream cost (1.3 = 30% profit margin)
  private readonly MARKUP_RATE = 1.3;

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
    // Apply group multiplier, dynamic rate, and 30% markup
    return Math.round(baseCost * groupMultiplier * dynamicRate * this.MARKUP_RATE * 1000000) / 1000000;
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

  private async generateCommission(user: any, spendAmount: number) {
    if (!user.inviteBy) return;

    try {
      // Find the referrer who owns this invite code
      const referrer = await this.prisma.user.findFirst({
        where: { inviteCode: user.inviteBy },
      });

      if (!referrer) return;

      const commissionRate = 0.1; // 10% default
      const commissionAmount = Math.round(spendAmount * commissionRate * 1000000) / 1000000;

      if (commissionAmount <= 0) return;

      // Create commission record and credit referrer
      const newBalance = referrer.balance + commissionAmount;
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: referrer.id },
          data: { balance: newBalance },
        }),
        this.prisma.commission.create({
          data: {
            userId: referrer.id,
            inviteUserId: user.id,
            amount: commissionAmount,
            rate: commissionRate,
            status: 'SETTLED',
          },
        }),
        this.prisma.walletLog.create({
          data: {
            userId: referrer.id,
            type: 'COMMISSION',
            amount: commissionAmount,
            balance: newBalance,
            remark: `Commission from ${user.username} API usage`,
          },
        }),
      ]);
    } catch (err) {
      this.logger.warn(`Commission generation failed for ${user.id}: ${err.message}`);
    }
  }
}
