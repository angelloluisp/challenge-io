export const PROCESSED_EVENT_REPOSITORY = Symbol('PROCESSED_EVENT_REPOSITORY');

export interface ProcessedEventRepository {
  wasProcessed(eventId: string, eventSource: string): Promise<boolean>;
  markAsProcessed(eventId: string, eventSource: string, eventType: string): Promise<void>;
}
