import { Module } from '@nestjs/common';
import { OUTBOX_EVENT_REPOSITORY } from '@card-domain/index';
import { PrismaOutboxEventRepository } from '@database/index';
import { KafkaProducerService, loadKafkaConfig } from '@kafka/index';
import { OutboxPublisherService } from './outbox-publisher.service';

@Module({
  providers: [
    OutboxPublisherService,
    { provide: OUTBOX_EVENT_REPOSITORY, useClass: PrismaOutboxEventRepository },
    {
      provide: KafkaProducerService,
      useFactory: () =>
        new KafkaProducerService(loadKafkaConfig('card-issuer', 'card-issuer-group')),
    },
  ],
})
export class OutboxModule {}
