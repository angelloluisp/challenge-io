import { Sleeper } from './sleeper';

export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
export const MAX_RETRIES = RETRY_DELAYS_MS.length;

export interface RetryOutcome<T> {
  succeeded: boolean;
  result?: T;
  attempts: number;
  lastError?: Error;
}

export class RetryPolicy {
  constructor(private readonly sleeper: Sleeper) {}

  async execute<T>(operation: (attempt: number) => Promise<T>): Promise<RetryOutcome<T>> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
      try {
        const result = await operation(attempt);
        return { succeeded: true, result, attempts: attempt };
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === MAX_RETRIES + 1;
        if (isLastAttempt) {
          return { succeeded: false, attempts: attempt, lastError };
        }
        await this.sleeper.sleep(RETRY_DELAYS_MS[attempt - 1]);
      }
    }
    return { succeeded: false, attempts: MAX_RETRIES + 1, lastError };
  }
}
