import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({ example: 'OpenAI', description: 'Provider display name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://api.openai.com/v1', description: 'Base URL for the provider API' })
  @IsString()
  baseUrl: string;

  @ApiProperty({ example: 'sk-...', description: 'API key for the provider' })
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 10, description: 'Routing priority (lower = higher priority)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}
