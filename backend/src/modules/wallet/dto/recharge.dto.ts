import { IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RechargeDto {
  @ApiProperty({ example: 100, description: 'Recharge amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'ALIPAY', enum: ['ALIPAY', 'WECHAT', 'USDT', 'STRIPE'], description: 'Payment method' })
  @IsEnum(['ALIPAY', 'WECHAT', 'USDT', 'STRIPE'] as const)
  payType: 'ALIPAY' | 'WECHAT' | 'USDT' | 'STRIPE';
}
