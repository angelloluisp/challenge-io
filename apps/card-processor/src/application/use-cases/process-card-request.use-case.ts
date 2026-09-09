import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CARD_REQUEST_REPOSITORY,
  CardRequestRepository,
  CardRequestStatus,
  MaskedPan,
  PROCESSED_EVENT_REPOSITORY,
  ProcessedEventRepository,
} from '@card-domain/index';
import { CardRequestedEventData, KafkaTopics } from '@contracts/index';
import { MAX_RETRIES, RetryPolicy, buildCloudEvent } from '@shared/index';
import { MetricsService } from '@observability/index';
import { CARD_ISSUER_PORT, CardIssuerPort } from '../ports/card-issuer.port';
import { CARD_ISSUANCE_WRITER, CardIssuanceWriter } from '../ports/card-issuance-writer.port';
import { EVENT_PUBLISHER, EventPublisher } from '../ports/event-publisher.port';

export interface ProcessCardRequestInput {
  eventId: number;
  eventSource: string;
  eventType: string;
  data: CardRequestedEventData;
}

@Injectable()
export class ProcessCardRequestUseCase {
  private readonly logger = new Logger(ProcessCardRequestUseCase.name);

  constructor(
    @Inject(CARD_REQUEST_REPOSITORY)
    private readonly cardRequestRepository: CardRequestRepository,
    @Inject(PROCESSED_EVENT_REPOSITORY)
    private readonly processedEventRepository: ProcessedEventRepository,
    @Inject(CARD_ISSUER_PORT)
    private readonly cardIssuerPort: CardIssuerPort,
    @Inject(CARD_ISSUANCE_WRITER)
    private readonly cardIssuanceWriter: CardIssuanceWriter,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    private readonly retryPolicy: RetryPolicy,
    private readonly metrics: MetricsService,
  ) {}

  async execute(input: ProcessCardRequestInput): Promise<void> {
    const eventIdKey = String(input.eventId);
    const alreadyProcessed = await this.processedEventRepository.wasProcessed(
      eventIdKey,
      input.eventSource,
    );
    if (alreadyProcessed) {
      this.logger.log(`Skipping duplicate delivery of event ${input.eventSource}#${eventIdKey}`);
      return;
    }

    const cardRequest = await this.cardRequestRepository.findByRequestId(input.data.requestId);
    if (!cardRequest) {
      this.logger.warn(`Card request ${input.data.requestId} was not found, discarding event`);
      await this.processedEventRepository.markAsProcessed(
        eventIdKey,
        input.eventSource,
        input.eventType,
      );
      return;
    }

    if (cardRequest.status !== CardRequestStatus.PENDING) {
      this.logger.log(
        `Card request ${cardRequest.requestId} already in status ${cardRequest.status}, skipping`,
      );
      await this.processedEventRepository.markAsProcessed(
        eventIdKey,
        input.eventSource,
        input.eventType,
      );
      return;
    }

    await this.cardIssuanceWriter.markProcessing(cardRequest.requestId);
    this.metrics.cardRequestsTotal.inc();

    const stopTimer = this.metrics.cardProcessingDurationSeconds.startTimer();
    const outcome = await this.retryPolicy.execute(async (attempt) => {
      if (attempt > 1) {
        this.metrics.cardRetryTotal.inc();
      }
      return this.cardIssuerPort.issueCard({
        requestId: cardRequest.requestId,
        documentNumber: cardRequest.documentNumber,
        forceError: cardRequest.forceError,
      });
    });
    stopTimer();

    if (outcome.succeeded && outcome.result) {
      await this.handleSuccess(cardRequest.requestId, cardRequest.documentNumber, outcome.result);
    } else {
      await this.handleFailure(input.data, outcome.attempts, outcome.lastError);
    }

    await this.processedEventRepository.markAsProcessed(
      eventIdKey,
      input.eventSource,
      input.eventType,
    );
  }

  private async handleSuccess(
    requestId: string,
    documentNumber: string,
    result: { cardId: string; cardNumber: string; expirationDate: string },
  ): Promise<void> {
    const maskedPan = MaskedPan.fromFullCardNumber(result.cardNumber).toString();
    await this.cardIssuanceWriter.markIssued({
      requestId,
      customerDocument: documentNumber,
      maskedPan,
      expirationDate: result.expirationDate,
    });
    this.metrics.cardIssuedTotal.inc();

    const event = buildCloudEvent(requestId, KafkaTopics.CARD_ISSUED, {
      requestId,
      cardId: result.cardId,
      maskedPan,
      expirationDate: result.expirationDate,
      status: 'ISSUED' as const,
    });
    await this.eventPublisher.publish(
      KafkaTopics.CARD_ISSUED,
      documentNumber,
      event as unknown as Record<string, unknown>,
    );
  }

  private async handleFailure(
    originalPayload: CardRequestedEventData,
    attempts: number,
    lastError: Error | undefined,
  ): Promise<void> {
    await this.cardIssuanceWriter.markFailed(originalPayload.requestId);
    this.metrics.cardFailedTotal.inc();
    this.metrics.cardDlqTotal.inc();

    const event = buildCloudEvent(originalPayload.requestId, KafkaTopics.CARD_REQUESTED_DLQ, {
      requestId: originalPayload.requestId,
      attempts,
      error: {
        code: 'CARD_ISSUER_FAILED',
        reason: lastError?.message ?? 'Unknown error after maximum retries',
      },
      originalPayload,
    });
    await this.eventPublisher.publish(
      KafkaTopics.CARD_REQUESTED_DLQ,
      originalPayload.documentNumber,
      event as unknown as Record<string, unknown>,
    );
    this.logger.warn(
      `Card request ${originalPayload.requestId} failed after ${attempts} attempts (max retries: ${MAX_RETRIES})`,
    );
  }
}
