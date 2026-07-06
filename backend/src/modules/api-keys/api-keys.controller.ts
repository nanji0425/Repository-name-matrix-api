import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModelsService } from '../models/models.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(
    private apiKeysService: ApiKeysService,
    private modelsService: ModelsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys for the current user' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.apiKeysService.findAllByUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(userId, dto);
  }

  @Get('models')
  @ApiOperation({ summary: 'List active models for API key restriction selection' })
  async listModels() {
    return this.modelsService.findAllActive();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.apiKeysService.delete(userId, id);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle API key status (enable/disable)' })
  async toggleStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.apiKeysService.toggleStatus(userId, id);
  }
}
