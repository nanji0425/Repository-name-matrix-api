import { All, Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { WalletService } from './wallet.service';
import { RechargeDto } from './dto/recharge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('recharge-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recharge payment configuration' })
  async getRechargeConfig() {
    return this.walletService.getRechargeConfig();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user balance' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet transaction logs with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getLogs(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getLogs(userId, +page || 1, +limit || 20);
  }

  @Post('recharge')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a recharge order' })
  async recharge(
    @CurrentUser('id') userId: string,
    @Body() dto: RechargeDto,
  ) {
    return this.walletService.createRechargeOrder(userId, dto);
  }

  @Post('confirm/:orderNo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Manually confirm a payment and add funds (admin)' })
  async confirmPayment(@Param('orderNo') orderNo: string) {
    return this.walletService.confirmPayment(orderNo);
  }

  @All('zpay/notify')
  @SkipThrottle()
  @ApiOperation({ summary: 'ZPay asynchronous payment notification' })
  async handleZpayNotify(@Req() req: Request, @Res() res: Response) {
    const source = { ...req.query, ...(req.body && typeof req.body === 'object' ? req.body : {}) };
    const params = Object.fromEntries(
      Object.entries(source).map(([key, value]) => [
        key,
        Array.isArray(value) ? String(value[0] ?? '') : String(value ?? ''),
      ]),
    );
    const handled = await this.walletService.handleZpayNotify(params);
    return res.type('text/plain').send(handled ? 'success' : 'fail');
  }
}
