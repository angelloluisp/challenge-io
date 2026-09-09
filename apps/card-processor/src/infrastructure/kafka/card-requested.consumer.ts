import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@kafka/index';
import { CardRequestedEvent, KafkaTopics } from '@contracts/index';
import { MetricsService } from '@observability/index';
import { ProcessCardRequestUseCase } from '../../application/use-cases/process-card-request.use-case';

@Injectable()
export class CardRequestedConsumer implements OnModuleInit {
  private readonly logger = new Logger(CardRequestedConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly processCardRequestUseCase: ProcessCardRequestUseCase,
    private readonly metrics: MetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaConsumer.subscribe([KafkaTopics.CARD_REQUESTED], async ({ message }) => {
      if (!message.value) {
        return;
      }
      try {
        const event = JSON.parse(message.value.toString()) as CardRequestedEvent;
        await this.processCardRequestUseCase.execute({
          eventId: event.id,
          eventSource: event.source,
          eventType: event.type,
          data: event.data,
        });
      } catch (error) {
        this.metrics.kafkaConsumerErrorsTotal.inc();
        this.logger.error(`Failed to process message: ${(error as Error).message}`);
      }
    });
  }
}
