import { CloudEvent } from '@contracts/index';

const eventSequenceByFlow = new Map<string, number>();

export function nextEventSequence(flowSource: string): number {
  const current = eventSequenceByFlow.get(flowSource) ?? 0;
  const next = current + 1;
  eventSequenceByFlow.set(flowSource, next);
  return next;
}

export function buildCloudEvent<T>(flowSource: string, type: string, data: T): CloudEvent<T> {
  return {
    id: nextEventSequence(flowSource),
    source: flowSource,
    type,
    time: new Date().toISOString(),
    data,
  };
}
