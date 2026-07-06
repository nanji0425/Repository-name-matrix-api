import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ModelsModule } from './modules/models/models.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { RequestLogsModule } from './modules/request-logs/request-logs.module';
import { TeamsModule } from './modules/teams/teams.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AdminModule } from './modules/admin/admin.module';
import { GroupsModule } from './modules/groups/groups.module';
import { DynamicRateModule } from './modules/dynamic-rate/dynamic-rate.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApiKeysModule,
    ModelsModule,
    ProvidersModule,
    WalletModule,
    OrdersModule,
    CommissionsModule,
    RequestLogsModule,
    TeamsModule,
    AnnouncementsModule,
    AdminModule,
    GroupsModule,
    DynamicRateModule,
    GatewayModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  controllers: [HealthController],
})
export class AppModule {}
