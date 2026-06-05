import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DynamicRateService } from './dynamic-rate.service';
import { SetRateDto } from './dto/set-rate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dynamic Rate')
@Controller('dynamic-rate')
export class DynamicRateController {
  constructor(private dynamicRateService: DynamicRateService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current dynamic rate (public)' })
  async getCurrent() {
    return this.dynamicRateService.getCurrentRate();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get rate history for trend chart' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  async getHistory(@Query('days') days?: number) {
    return this.dynamicRateService.getRateHistory(+days || 7);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dynamic rate (admin)' })
  async setRate(@Body() dto: SetRateDto) {
    return this.dynamicRateService.setRate(dto);
  }
}
