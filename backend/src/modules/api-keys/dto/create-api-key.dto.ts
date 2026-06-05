import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My API Key', description: 'Name of the API key' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
