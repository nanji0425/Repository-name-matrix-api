import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'My Team', description: 'Team name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'uuid-of-member', description: 'Optional user ID to add as initial member', required: false })
  @IsOptional()
  @IsString()
  memberId?: string;
}
