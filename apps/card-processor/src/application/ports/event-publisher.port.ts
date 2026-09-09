export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface EventPublisher {
  publish(topic: string, key: string, payload: Record<string, unknown>): Promise<void>;
}
