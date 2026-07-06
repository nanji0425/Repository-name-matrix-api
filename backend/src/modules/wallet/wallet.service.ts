import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RechargeDto } from './dto/recharge.dto';
import {
  buildZpayPaymentUrl,
  normalizeZpayGateway,
  signZpayParams,
  verifyZpaySignature,
  ZpayParams,
} from './zpay';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true },
    });

    if (!user) throw new NotFoundException('User not found');
    return { balance: user.balance };
  }

  async getLogs(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.walletLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletLog.count({ where: { userId } }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async confirmPayment(orderNo: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Order already processed (status: ${order.status})`);
    }

    await this.settlePendingOrder(orderNo, `Recharge via ${order.payType} (${orderNo})`, true);

    this.logger.log(`Payment confirmed: ${orderNo}, amount: ${order.amount}`);
    return { message: 'Payment confirmed successfully', orderNo };
  }

  async handleZpayNotify(params: ZpayParams) {
    if (!verifyZpaySignature(params, this.getZpayKey())) {
      this.logger.warn(`Invalid ZPay signature for order: ${params.out_trade_no || 'unknown'}`);
      return false;
    }

    if (params.trade_status !== 'TRADE_SUCCESS') {
      this.logger.warn(`Ignored non-success ZPay notification: ${params.trade_status || 'unknown'}`);
      return false;
    }

    const orderNo = String(params.out_trade_no || '');
    const paidAmount = Number(params.money);
    if (!orderNo || !Number.isFinite(paidAmount)) return false;

    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) return false;

    if (Math.abs(order.amount - paidAmount) > 0.000001) {
      this.logger.warn(`ZPay amount mismatch for ${orderNo}: expected ${order.amount}, got ${paidAmount}`);
      return false;
    }

    if (order.status !== 'PENDING') return true;

    await this.settlePendingOrder(orderNo, `Recharge via ZPay ${params.type || order.payType} (${orderNo})`, false);
    return true;
  }

  async getRechargeConfig() {
    return {
      payTypes: ['ALIPAY'],
      payName: 'ZPay 在线支付',
      payHint: '当前仅支持支付宝。提交订单后将跳转至收银台，支付成功后余额自动到账。',
      contactQq: '3315419516',
      gateway: normalizeZpayGateway(process.env.ZPAY_GATEWAY),
    };
  }

  async createRechargeOrder(userId: string, dto: RechargeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (dto.amount <= 0) throw new BadRequestException('Amount must be greater than 0');

    const orderNo = `RE${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;
    const payType = 'alipay';
    const paymentParams = {
      pid: this.getZpayPid(),
      type: payType,
      out_trade_no: orderNo,
      notify_url: this.getZpayNotifyUrl(),
      return_url: this.getZpayReturnUrl(),
      name: `MatrixAPI recharge ${orderNo}`,
      money: this.formatAmount(dto.amount),
    };
    const signedParams = {
      ...paymentParams,
      sign: signZpayParams(paymentParams, this.getZpayKey()),
      sign_type: 'MD5',
    };
    const payUrl = buildZpayPaymentUrl(normalizeZpayGateway(process.env.ZPAY_GATEWAY), signedParams);

    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNo,
        amount: dto.amount,
        payType: dto.payType,
        status: 'PENDING',
        payUrl,
      },
      select: {
        id: true,
        orderNo: true,
        amount: true,
        payType: true,
        payUrl: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      ...order,
      paymentProvider: 'ZPAY',
      payUrl,
    };
  }

  private async settlePendingOrder(orderNo: string, remark: string, throwIfProcessed: boolean) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });

      if (updatedOrder.count !== 1) {
        if (throwIfProcessed) {
          throw new BadRequestException(`Order already processed (status: ${order.status})`);
        }
        return;
      }

      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.amount } },
        select: { balance: true },
      });

      await tx.walletLog.create({
        data: {
          userId: order.userId,
          type: 'RECHARGE',
          amount: order.amount,
          balance: updatedUser.balance,
          remark,
        },
      });
    });
  }

  private getZpayPid() {
    const pid = process.env.ZPAY_PID;
    if (!pid) throw new BadRequestException('ZPay merchant PID is not configured');
    return pid;
  }

  private getZpayKey() {
    const key = process.env.ZPAY_KEY;
    if (!key) throw new BadRequestException('ZPay merchant key is not configured');
    return key;
  }

  private getZpayNotifyUrl() {
    return process.env.ZPAY_NOTIFY_URL || `${this.getApiPublicUrl()}/wallet/zpay/notify`;
  }

  private getZpayReturnUrl() {
    return process.env.ZPAY_RETURN_URL || `${process.env.FRONTEND_URL || 'https://matrixapi.online'}/dashboard/balance`;
  }

  private getApiPublicUrl() {
    return (process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || 'https://matrixapi.online/api').replace(/\/$/, '');
  }

  private formatAmount(amount: number) {
    return Number(amount).toFixed(2);
  }
}
