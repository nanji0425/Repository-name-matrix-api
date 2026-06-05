import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List commissions earned by the current user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findMyCommissions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commissionsService.findByUser(userId, +page || 1, +limit || 20);
  }

  @Get('invited-by')
  @ApiOperation({ summary: 'List commissions where the current user was the invitee' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findByInviteUser(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commissionsService.findByInviteUser(userId, +page || 1, +limit || 20);
  }

  @Get('total')
  @ApiOperation({ summary: 'Get total earned commissions for the current user' })
  async getTotalEarned(@CurrentUser('id') userId: string) {
    return this.commissionsService.getTotalEarned(userId);
  }
}
