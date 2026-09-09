import { CardRequest } from '../entities/card-request.entity';

export const CARD_REQUEST_REPOSITORY = Symbol('CARD_REQUEST_REPOSITORY');

export interface CardRequestRepository {
  findByRequestId(requestId: string): Promise<CardRequest | null>;
  findByDocumentNumber(documentNumber: string): Promise<CardRequest | null>;
  update(cardRequest: CardRequest): Promise<void>;
}
