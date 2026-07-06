import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RechargeDto {
  @ApiProperty({ example: 100, description: 'Recharge amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'ALIPAY', enum: ['ALIPAY', 'WECHAT'], description: 'Payment method' })
  @IsString()
  payType: 'ALIPAY' | 'WECHAT';
}
