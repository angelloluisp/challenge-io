import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly cardRequestsTotal = new Counter({
    name: 'card_requests_total',
    help: 'Total number of card issuance requests received',
    registers: [this.registry],
  });

  readonly cardIssuedTotal = new Counter({
    name: 'card_issued_total',
    help: 'Total number of cards issued successfully',
    registers: [this.registry],
  });

  readonly cardFailedTotal = new Counter({
    name: 'card_failed_total',
    help: 'Total number of card requests that ended as FAILED',
    registers: [this.registry],
  });

  readonly cardRetryTotal = new Counter({
    name: 'card_retry_total',
    help: 'Total number of retry attempts against the card issuer',
    registers: [this.registry],
  });

  readonly cardDlqTotal = new Counter({
    name: 'card_dlq_total',
    help: 'Total number of events sent to the dead letter queue',
    registers: [this.registry],
  });

  readonly cardProcessingDurationSeconds = new Histogram({
    name: 'card_processing_duration_seconds',
    help: 'Duration of the card processing use case',
    buckets: [0.1, 0.25, 0.5, 1, 2, 4, 8],
    registers: [this.registry],
  });

  readonly kafkaConsumerErrorsTotal = new Counter({
    name: 'kafka_consumer_errors_total',
    help: 'Total number of unhandled errors in Kafka consumers',
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
