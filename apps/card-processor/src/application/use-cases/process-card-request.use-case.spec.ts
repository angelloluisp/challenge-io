import { CardRequest } from '@card-domain/index';
import { ImmediateSleeper, RetryPolicy } from '@shared/index';
import { MetricsService } from '@observability/index';
import { ProcessCardRequestUseCase } from './process-card-request.use-case';

describe('ProcessCardRequestUseCase', () => {
  function buildPendingRequest(overrides: { forceError?: boolean } = {}): CardRequest {
    return CardRequest.create({
      id: 'internal-id',
      requestId: 'request-1',
      documentType: 'DNI' as never,
      documentNumber: '11654321',
      fullName: 'Jose Perez',
      age: 30,
      email: 'joseperez@example.com',
      cardType: 'VISA' as never,
      currency: 'PEN' as never,
      forceError: overrides.forceError ?? false,
    });
  }

  function buildUseCase(options: {
    cardRequest: CardRequest | null;
    alreadyProcessed?: boolean;
    issueCard: jest.Mock;
  }) {
    const cardRequestRepository = {
      findByRequestId: jest.fn().mockResolvedValue(options.cardRequest),
      findByDocumentNumber: jest.fn(),
      update: jest.fn(),
    };
    const processedEventRepository = {
      wasProcessed: jest.fn().mockResolvedValue(options.alreadyProcessed ?? false),
      markAsProcessed: jest.fn().mockResolvedValue(undefined),
    };
    const cardIssuerPort = { issueCard: options.issueCard };
    const cardIssuanceWriter = {
      markProcessing: jest.fn().mockResolvedValue(undefined),
      markIssued: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    const eventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };
    const metrics = new MetricsService();

    const useCase = new ProcessCardRequestUseCase(
      cardRequestRepository,
      processedEventRepository,
      cardIssuerPort,
      cardIssuanceWriter,
      eventPublisher,
      new RetryPolicy(new ImmediateSleeper()),
      metrics,
    );

    return {
      useCase,
      cardRequestRepository,
      processedEventRepository,
      cardIssuanceWriter,
      eventPublisher,
    };
  }

  const baseInput = {
    eventId: 1,
    eventSource: 'request-1',
    eventType: 'io.card.requested.v1',
    data: {
      requestId: 'request-1',
      documentType: 'DNI',
      documentNumber: '11654321',
      fullName: 'Jose Perez',
      age: 30,
      email: 'joseperez@example.com',
      cardType: 'VISA',
      currency: 'PEN',
      forceError: false,
    },
  };

  it('issues the card and publishes the success event when the issuer succeeds', async () => {
    const issueCard = jest.fn().mockResolvedValue({
      cardId: 'card-1',
      cardNumber: '4111111111111111',
      expirationDate: '09/30',
      cvv: '123',
    });
    const { useCase, cardIssuanceWriter, eventPublisher, processedEventRepository } = buildUseCase({
      cardRequest: buildPendingRequest(),
      issueCard,
    });

    await useCase.execute(baseInput);

    expect(cardIssuanceWriter.markIssued).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-1',
        maskedPan: expect.stringContaining('1111'),
      }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      'io.cards.issued.v1',
      '11654321',
      expect.any(Object),
    );
    expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
      '1',
      'request-1',
      'io.card.requested.v1',
    );
  });

  it('retries after a temporary failure and eventually succeeds', async () => {
    const issueCard = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({
        cardId: 'card-1',
        cardNumber: '4111111111111111',
        expirationDate: '09/30',
        cvv: '123',
      });
    const { useCase, cardIssuanceWriter } = buildUseCase({
      cardRequest: buildPendingRequest(),
      issueCard,
    });

    await useCase.execute(baseInput);

    expect(issueCard).toHaveBeenCalledTimes(2);
    expect(cardIssuanceWriter.markIssued).toHaveBeenCalledTimes(1);
  });

  it('sends the request to the DLQ after exhausting all retries', async () => {
    const issueCard = jest.fn().mockRejectedValue(new Error('permanent failure'));
    const { useCase, cardIssuanceWriter, eventPublisher } = buildUseCase({
      cardRequest: buildPendingRequest({ forceError: true }),
      issueCard,
    });

    await useCase.execute(baseInput);

    expect(issueCard).toHaveBeenCalledTimes(4);
    expect(cardIssuanceWriter.markFailed).toHaveBeenCalledWith('request-1');
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      'io.card.requested.v1.dlq',
      '11654321',
      expect.any(Object),
    );
  });

  it('skips processing when the event was already processed (idempotency)', async () => {
    const issueCard = jest.fn();
    const { useCase, cardIssuanceWriter } = buildUseCase({
      cardRequest: buildPendingRequest(),
      alreadyProcessed: true,
      issueCard,
    });

    await useCase.execute(baseInput);

    expect(issueCard).not.toHaveBeenCalled();
    expect(cardIssuanceWriter.markProcessing).not.toHaveBeenCalled();
  });

  it('does not reissue a card when the request is no longer PENDING', async () => {
    const pendingRequest = buildPendingRequest();
    (pendingRequest as unknown as { markAsIssued: () => void }).markAsIssued();
    const issueCard = jest.fn();
    const { useCase, cardIssuanceWriter } = buildUseCase({
      cardRequest: pendingRequest,
      issueCard,
    });

    await useCase.execute(baseInput);

    expect(issueCard).not.toHaveBeenCalled();
    expect(cardIssuanceWriter.markProcessing).not.toHaveBeenCalled();
  });
});
