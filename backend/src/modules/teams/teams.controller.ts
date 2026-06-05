import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List teams owned by the current user' })
  async findMyTeams(@CurrentUser('id') userId: string) {
    return this.teamsService.findByOwner(userId);
  }

  @Get('joined')
  @ApiOperation({ summary: 'List teams where the current user is a member' })
  async findJoinedTeams(@CurrentUser('id') userId: string) {
    return this.teamsService.findMemberTeams(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async findById(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(userId, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a team (owner only)' })
  async addMember(
    @CurrentUser('id') userId: string,
    @Param('id') teamId: string,
    @Body('userId') memberUserId: string,
  ) {
    return this.teamsService.addMember(teamId, userId, memberUserId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from a team (owner only)' })
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('id') teamId: string,
    @Param('memberId') memberUserId: string,
  ) {
    return this.teamsService.removeMember(teamId, userId, memberUserId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a team (owner only)' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') teamId: string,
  ) {
    return this.teamsService.delete(teamId, userId);
  }
}
