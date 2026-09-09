import { CardRequest } from '@card-domain/index';

export const CARD_REQUEST_WRITER = Symbol('CARD_REQUEST_WRITER');

export interface CardRequestWriter {
  createWithOutboxEvent(
    cardRequest: CardRequest,
    eventType: string,
    eventPayload: Record<string, unknown>,
  ): Promise<void>;
}
