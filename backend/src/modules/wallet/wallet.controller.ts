import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { RechargeDto } from './dto/recharge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user balance' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('logs')
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
  @ApiOperation({ summary: 'Create a recharge order' })
  async recharge(
    @CurrentUser('id') userId: string,
    @Body() dto: RechargeDto,
  ) {
    return this.walletService.createRechargeOrder(userId, dto);
  }

  @Post('confirm/:orderNo')
  @ApiOperation({ summary: 'Confirm a payment and add funds (admin or callback)' })
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Param('orderNo') orderNo: string) {
    return this.walletService.confirmPayment(orderNo);
  }
}
