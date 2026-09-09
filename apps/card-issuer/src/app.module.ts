import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from '@database/index';
import { ObservabilityModule, buildPinoLoggerParams } from '@observability/index';
import { CardsModule } from './cards.module';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(buildPinoLoggerParams('card-issuer')),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    DatabaseModule,
    ObservabilityModule,
    CardsModule,
    OutboxModule,
  ],
})
export class AppModule {}
