import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { KafkaConfig } from './kafka.config';

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: { initialRetryTime: 300, retries: 5 },
    });
    this.consumer = this.kafka.consumer({ groupId: config.consumerGroupId });
  }

  async subscribe(topics: string[], handler: MessageHandler): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topics, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          await handler(payload);
        } catch (error) {
          this.logger.error(
            `Unhandled error processing message from ${payload.topic}: ${(error as Error).message}`,
          );
        }
      },
    });
    this.logger.log(`Kafka consumer subscribed to ${topics.join(', ')}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }
}
