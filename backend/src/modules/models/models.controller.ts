import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Models')
@Controller('models')
export class ModelsController {
  constructor(private modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active models (public)' })
  async findAllActive() {
    return this.modelsService.findAllActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all models including inactive (admin)' })
  async findAll() {
    return this.modelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single model by ID' })
  async findById(@Param('id') id: string) {
    return this.modelsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new model (admin)' })
  async create(@Body() dto: CreateModelDto) {
    return this.modelsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a model (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.modelsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle model status (active/inactive) (admin)' })
  async toggleStatus(@Param('id') id: string) {
    return this.modelsService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a model (admin)' })
  async delete(@Param('id') id: string) {
    return this.modelsService.delete(id);
  }
}
