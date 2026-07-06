import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class RateLimitSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRequests?: number;

  @ApiPropertyOptional({ minimum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  windowMs?: number;
}

export class PaymentSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  alipay?: boolean;
}

export class GeneralSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowRegistration?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireInviteCode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ type: RateLimitSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitSettingsDto)
  rateLimit?: RateLimitSettingsDto;

  @ApiPropertyOptional({ type: PaymentSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  payments?: PaymentSettingsDto;

  @ApiPropertyOptional({ type: GeneralSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general?: GeneralSettingsDto;
}
