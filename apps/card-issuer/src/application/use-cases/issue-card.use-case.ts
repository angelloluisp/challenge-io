import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  CARD_REQUEST_REPOSITORY,
  CardAlreadyExistsError,
  CardRequest,
  CardRequestRepository,
  CardRequestStatus,
} from '@card-domain/index';
import { KafkaTopics } from '@contracts/index';
import { buildCloudEvent } from '@shared/index';
import { IssueCardCommand } from '../commands/issue-card.command';
import { CARD_REQUEST_WRITER, CardRequestWriter } from '../ports/card-request-writer.port';

export interface IssueCardResult {
  requestId: string;
  status: CardRequestStatus;
}

@Injectable()
export class IssueCardUseCase {
  constructor(
    @Inject(CARD_REQUEST_REPOSITORY)
    private readonly cardRequestRepository: CardRequestRepository,
    @Inject(CARD_REQUEST_WRITER)
    private readonly cardRequestWriter: CardRequestWriter,
  ) {}

  async execute(command: IssueCardCommand): Promise<IssueCardResult> {
    const existingRequest = await this.cardRequestRepository.findByDocumentNumber(
      command.documentNumber,
    );
    if (existingRequest) {
      throw new CardAlreadyExistsError(command.documentNumber);
    }

    const requestId = uuid();
    const cardRequest = CardRequest.create({
      id: uuid(),
      requestId,
      documentType: command.documentType,
      documentNumber: command.documentNumber,
      fullName: command.fullName,
      age: command.age,
      email: command.email,
      cardType: command.cardType,
      currency: command.currency,
      forceError: command.forceError,
    });

    const event = buildCloudEvent(requestId, KafkaTopics.CARD_REQUESTED, {
      requestId,
      documentType: command.documentType,
      documentNumber: command.documentNumber,
      fullName: command.fullName,
      age: command.age,
      email: command.email,
      cardType: command.cardType,
      currency: command.currency,
      forceError: command.forceError,
    });

    await this.cardRequestWriter.createWithOutboxEvent(
      cardRequest,
      KafkaTopics.CARD_REQUESTED,
      event as unknown as Record<string, unknown>,
    );

    return { requestId, status: cardRequest.status };
  }
}
