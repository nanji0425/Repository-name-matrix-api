import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({ example: 'GPT-4o', description: 'Display name of the model' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'gpt-4o', description: 'Unique model code used in API calls' })
  @IsString()
  modelCode: string;

  @ApiProperty({ example: 'uuid-of-provider', description: 'Provider ID this model belongs to' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: 2.5, description: 'Input price per million tokens' })
  @IsNumber()
  @Min(0)
  inputPrice: number;

  @ApiProperty({ example: 10.0, description: 'Output price per million tokens' })
  @IsNumber()
  @Min(0)
  outputPrice: number;

  @ApiProperty({ example: 1.0, description: 'Price multiplier', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  multiplier?: number;

  @ApiProperty({ example: 0, description: 'Sort order (lower = higher priority)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
