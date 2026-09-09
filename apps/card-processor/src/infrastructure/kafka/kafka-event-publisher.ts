import { Injectable } from '@nestjs/common';
import { KafkaProducerService } from '@kafka/index';
import { EventPublisher } from '../../application/ports/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisher {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async publish(topic: string, key: string, payload: Record<string, unknown>): Promise<void> {
    await this.kafkaProducer.publish(topic, key, payload);
  }
}
