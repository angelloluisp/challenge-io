import { CloudEvent } from '../cloud-event';

export interface CardIssuedEventData {
  requestId: string;
  cardId: string;
  maskedPan: string;
  expirationDate: string;
  status: 'ISSUED';
}

export type CardIssuedEvent = CloudEvent<CardIssuedEventData>;
