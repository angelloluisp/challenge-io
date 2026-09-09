export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  consumerGroupId: string;
}

export function loadKafkaConfig(clientId: string, consumerGroupId: string): KafkaConfig {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
  return { clientId, brokers, consumerGroupId };
}
