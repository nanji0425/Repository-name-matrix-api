import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequestLogsService } from './request-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Request Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('request-logs')
export class RequestLogsController {
  constructor(private requestLogsService: RequestLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user API request logs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by model name or API key name' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by HTTP status code (e.g. 200, 400, 500)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async findMyLogs(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('modelId') modelId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.requestLogsService.findByUser(userId, {
      page: +page || 1,
      limit: +limit || 20,
      search,
      modelId,
      status,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get usage statistics for the current user' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.requestLogsService.getStats(userId);
  }
}
