import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My API Key', description: 'Name of the API key' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 100, required: false, description: 'Optional USD usage quota for this token' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  quota?: number;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', required: false, description: 'Optional expiration time' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: ['gpt-4o-mini', 'deepseek-chat'], required: false, description: 'Allowed model codes', type: [String] })
  @IsOptional()
  @IsArray()
  allowedModelCodes?: string[];
}
