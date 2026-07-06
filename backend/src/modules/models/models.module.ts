import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { ModelSyncService } from './model-sync.service';

@Module({
  controllers: [ModelsController],
  providers: [ModelsService, ModelSyncService],
  exports: [ModelsService, ModelSyncService],
})
export class ModelsModule {}
