import { CloudEvent } from '../cloud-event';
import { CardRequestedEventData } from './card-requested.event';

export interface CardRequestedDlqEventData {
  requestId: string;
  attempts: number;
  error: {
    code: string;
    reason: string;
  };
  originalPayload: CardRequestedEventData;
}

export type CardRequestedDlqEvent = CloudEvent<CardRequestedDlqEventData>;
