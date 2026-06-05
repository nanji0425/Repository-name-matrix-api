import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'System Maintenance', description: 'Announcement title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'We will be performing maintenance on...', description: 'Announcement content' })
  @IsString()
  content: string;

  @ApiProperty({ example: 0, description: 'Priority (higher = more important)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({ example: true, description: 'Whether the announcement is published', required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Start time (ISO string)', required: false })
  @IsOptional()
  @IsString()
  startAt?: string;

  @ApiProperty({ example: '2024-01-31T23:59:59Z', description: 'End time (ISO string)', required: false })
  @IsOptional()
  @IsString()
  endAt?: string;
}
