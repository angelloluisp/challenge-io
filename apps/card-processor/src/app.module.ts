import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from '@database/index';
import { ObservabilityModule, buildPinoLoggerParams } from '@observability/index';
import { ProcessorModule } from './processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(buildPinoLoggerParams('card-processor')),
    DatabaseModule,
    ObservabilityModule,
    ProcessorModule,
  ],
})
export class AppModule {}
