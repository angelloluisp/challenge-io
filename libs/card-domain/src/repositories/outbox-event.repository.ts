import { OutboxEventStatus } from '../enums';

export interface OutboxEventRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  attempts: number;
  createdAt: Date;
  publishedAt: Date | null;
}

export const OUTBOX_EVENT_REPOSITORY = Symbol('OUTBOX_EVENT_REPOSITORY');

export interface OutboxEventRepository {
  findPendingBatch(limit: number): Promise<OutboxEventRecord[]>;
  markAsPublished(id: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}
