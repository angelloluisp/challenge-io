import { CloudEvent } from '../cloud-event';

export interface CardRequestedEventData {
  requestId: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
  cardType: string;
  currency: string;
  forceError: boolean;
}

export type CardRequestedEvent = CloudEvent<CardRequestedEventData>;
