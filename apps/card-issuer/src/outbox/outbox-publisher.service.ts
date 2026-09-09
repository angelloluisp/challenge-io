import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  OUTBOX_EVENT_REPOSITORY,
  OutboxEventRecord,
  OutboxEventRepository,
} from '@card-domain/index';
import { KafkaProducerService } from '@kafka/index';

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer: NodeJS.Timeout | undefined;
  private isPublishing = false;
  private readonly pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 500);
  private readonly batchSize = Number(process.env.OUTBOX_BATCH_SIZE ?? 20);

  constructor(
    @Inject(OUTBOX_EVENT_REPOSITORY)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.publishPendingEvents();
    }, this.pollIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async publishPendingEvents(): Promise<void> {
    if (this.isPublishing) {
      return;
    }
    this.isPublishing = true;
    try {
      const pendingEvents = await this.outboxEventRepository.findPendingBatch(this.batchSize);
      for (const event of pendingEvents) {
        await this.publishSingleEvent(event);
      }
    } catch (error) {
      this.logger.error(`Failed to poll outbox events: ${(error as Error).message}`);
    } finally {
      this.isPublishing = false;
    }
  }

  private async publishSingleEvent(event: OutboxEventRecord): Promise<void> {
    try {
      await this.kafkaProducer.publish(event.eventType, event.aggregateId, event.payload);
      await this.outboxEventRepository.markAsPublished(event.id);
    } catch (error) {
      await this.outboxEventRepository.incrementAttempts(event.id);
      this.logger.error(
        `Failed to publish outbox event ${event.id} (${event.eventType}): ${(error as Error).message}`,
      );
    }
  }
}
