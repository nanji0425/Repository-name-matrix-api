import { Module } from '@nestjs/common';
import { DynamicRateController } from './dynamic-rate.controller';
import { DynamicRateService } from './dynamic-rate.service';

@Module({
  controllers: [DynamicRateController],
  providers: [DynamicRateService],
  exports: [DynamicRateService],
})
export class DynamicRateModule {}
