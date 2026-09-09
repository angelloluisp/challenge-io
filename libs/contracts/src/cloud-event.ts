export interface CloudEvent<T> {
  id: number;
  source: string;
  type: string;
  time: string;
  data: T;
}

export const KafkaTopics = {
  CARD_REQUESTED: 'io.card.requested.v1',
  CARD_ISSUED: 'io.cards.issued.v1',
  CARD_REQUESTED_DLQ: 'io.card.requested.v1.dlq',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
