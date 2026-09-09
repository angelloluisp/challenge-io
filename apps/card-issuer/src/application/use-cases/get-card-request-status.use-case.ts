import { Inject, Injectable } from '@nestjs/common';
import {
  CARD_REQUEST_REPOSITORY,
  CardRequestNotFoundError,
  CardRequestRepository,
  CardRequestStatus,
} from '@card-domain/index';
import { CARD_STATUS_READER, CardStatusReader } from '../ports/card-status-reader.port';

export interface CardRequestStatusResult {
  requestId: string;
  status: CardRequestStatus;
  maskedPan?: string;
  expirationDate?: string;
}

@Injectable()
export class GetCardRequestStatusUseCase {
  constructor(
    @Inject(CARD_REQUEST_REPOSITORY)
    private readonly cardRequestRepository: CardRequestRepository,
    @Inject(CARD_STATUS_READER)
    private readonly cardStatusReader: CardStatusReader,
  ) {}

  async execute(requestId: string): Promise<CardRequestStatusResult> {
    const cardRequest = await this.cardRequestRepository.findByRequestId(requestId);
    if (!cardRequest) {
      throw new CardRequestNotFoundError(requestId);
    }
    const card = await this.cardStatusReader.findCardByRequestId(requestId);
    return {
      requestId: cardRequest.requestId,
      status: cardRequest.status,
      maskedPan: card?.maskedPan,
      expirationDate: card?.expirationDate,
    };
  }
}
