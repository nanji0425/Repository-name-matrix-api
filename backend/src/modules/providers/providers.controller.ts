import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all providers (admin)' })
  async findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a provider by ID (admin)' })
  async findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider (admin)' })
  async create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a provider (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle provider status (active/inactive) (admin)' })
  async toggleStatus(@Param('id') id: string) {
    return this.providersService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a provider (admin)' })
  async delete(@Param('id') id: string) {
    return this.providersService.delete(id);
  }
}
