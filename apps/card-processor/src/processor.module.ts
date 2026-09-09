import { Module } from '@nestjs/common';
import { CARD_REQUEST_REPOSITORY, PROCESSED_EVENT_REPOSITORY } from '@card-domain/index';
import { PrismaCardRequestRepository, PrismaProcessedEventRepository } from '@database/index';
import { KafkaConsumerService, KafkaProducerService, loadKafkaConfig } from '@kafka/index';
import { RealSleeper, RetryPolicy, SLEEPER, Sleeper } from '@shared/index';
import { ProcessCardRequestUseCase } from './application/use-cases/process-card-request.use-case';
import { CARD_ISSUER_PORT } from './application/ports/card-issuer.port';
import { CARD_ISSUANCE_WRITER } from './application/ports/card-issuance-writer.port';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { SimulatedCardIssuerAdapter } from './infrastructure/external/simulated-card-issuer.adapter';
import { PrismaCardIssuanceWriter } from './infrastructure/persistence/prisma-card-issuance-writer';
import { KafkaEventPublisher } from './infrastructure/kafka/kafka-event-publisher';
import { CardRequestedConsumer } from './infrastructure/kafka/card-requested.consumer';

@Module({
  providers: [
    ProcessCardRequestUseCase,
    CardRequestedConsumer,
    { provide: CARD_REQUEST_REPOSITORY, useClass: PrismaCardRequestRepository },
    { provide: PROCESSED_EVENT_REPOSITORY, useClass: PrismaProcessedEventRepository },
    { provide: CARD_ISSUANCE_WRITER, useClass: PrismaCardIssuanceWriter },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    {
      provide: SLEEPER,
      useClass: RealSleeper,
    },
    {
      provide: CARD_ISSUER_PORT,
      useFactory: (sleeper: Sleeper) => new SimulatedCardIssuerAdapter(sleeper),
      inject: [SLEEPER],
    },
    {
      provide: RetryPolicy,
      useFactory: (sleeper: Sleeper) => new RetryPolicy(sleeper),
      inject: [SLEEPER],
    },
    {
      provide: KafkaProducerService,
      useFactory: () =>
        new KafkaProducerService(loadKafkaConfig('card-processor', 'card-processor-group')),
    },
    {
      provide: KafkaConsumerService,
      useFactory: () =>
        new KafkaConsumerService(loadKafkaConfig('card-processor', 'card-processor-group')),
    },
  ],
})
export class ProcessorModule {}
