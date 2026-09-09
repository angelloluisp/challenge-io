import { CardAlreadyExistsError, CardRequest } from '@card-domain/index';
import { IssueCardUseCase } from './issue-card.use-case';
import { CardRequestWriter } from '../ports/card-request-writer.port';
import { IssueCardCommand } from '../commands/issue-card.command';

describe('IssueCardUseCase', () => {
  const validCommand: IssueCardCommand = {
    documentType: 'DNI' as never,
    documentNumber: '11654321',
    fullName: 'Jose Perez',
    age: 30,
    email: 'joseperez@example.com',
    cardType: 'VISA' as never,
    currency: 'PEN' as never,
    forceError: false,
  };

  function buildUseCase(existingRequest: CardRequest | null, writer?: Partial<CardRequestWriter>) {
    const cardRequestRepository = {
      findByRequestId: jest.fn(),
      findByDocumentNumber: jest.fn().mockResolvedValue(existingRequest),
      update: jest.fn(),
    };
    const cardRequestWriter: CardRequestWriter = {
      createWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
      ...writer,
    };
    const useCase = new IssueCardUseCase(cardRequestRepository, cardRequestWriter);
    return { useCase, cardRequestRepository, cardRequestWriter };
  }

  it('creates a PENDING card request and persists an outbox event when the customer is new', async () => {
    const { useCase, cardRequestWriter } = buildUseCase(null);

    const result = await useCase.execute(validCommand);

    expect(result.status).toBe('PENDING');
    expect(result.requestId).toEqual(expect.any(String));
    expect(cardRequestWriter.createWithOutboxEvent).toHaveBeenCalledTimes(1);
    const [cardRequestArg, eventType] = (cardRequestWriter.createWithOutboxEvent as jest.Mock).mock
      .calls[0];
    expect(cardRequestArg.documentNumber).toBe(validCommand.documentNumber);
    expect(eventType).toBe('io.card.requested.v1');
  });

  it('throws CardAlreadyExistsError when the customer already has a card request', async () => {
    const existingRequest = CardRequest.create({
      id: 'existing-id',
      requestId: 'existing-request-id',
      documentType: 'DNI' as never,
      documentNumber: validCommand.documentNumber,
      fullName: 'Jose Perez',
      age: 30,
      email: 'joseperez@example.com',
      cardType: 'VISA' as never,
      currency: 'PEN' as never,
      forceError: false,
    });
    const { useCase } = buildUseCase(existingRequest);

    await expect(useCase.execute(validCommand)).rejects.toThrow(CardAlreadyExistsError);
  });

  it('propagates repository failures without swallowing them', async () => {
    const { useCase, cardRequestWriter } = buildUseCase(null, {
      createWithOutboxEvent: jest.fn().mockRejectedValue(new Error('db unavailable')),
    });

    await expect(useCase.execute(validCommand)).rejects.toThrow('db unavailable');
    expect(cardRequestWriter.createWithOutboxEvent).toHaveBeenCalledTimes(1);
  });
});
