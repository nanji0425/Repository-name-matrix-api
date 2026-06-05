import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
