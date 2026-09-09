import { ImmediateSleeper, MAX_RETRIES, RETRY_DELAYS_MS, RetryPolicy, Sleeper } from './index';

describe('RetryPolicy', () => {
  let recordedDelays: number[];
  let sleeperSpy: Sleeper;

  beforeEach(() => {
    recordedDelays = [];
    sleeperSpy = {
      sleep: async (ms: number) => {
        recordedDelays.push(ms);
        await new ImmediateSleeper().sleep();
      },
    };
  });

  it('returns the result on the first attempt without sleeping', async () => {
    const policy = new RetryPolicy(sleeperSpy);
    const outcome = await policy.execute(async () => 'ok');

    expect(outcome.succeeded).toBe(true);
    expect(outcome.result).toBe('ok');
    expect(outcome.attempts).toBe(1);
    expect(recordedDelays).toEqual([]);
  });

  it('retries using the configured delays 1000, 2000 and 4000 ms', async () => {
    const policy = new RetryPolicy(sleeperSpy);
    let callCount = 0;

    const outcome = await policy.execute(async () => {
      callCount += 1;
      if (callCount < 3) {
        throw new Error('temporary failure');
      }
      return 'recovered';
    });

    expect(outcome.succeeded).toBe(true);
    expect(outcome.attempts).toBe(3);
    expect(recordedDelays).toEqual([RETRY_DELAYS_MS[0], RETRY_DELAYS_MS[1]]);
  });

  it('gives up after the maximum number of retries', async () => {
    const policy = new RetryPolicy(sleeperSpy);

    const outcome = await policy.execute(async () => {
      throw new Error('permanent failure');
    });

    expect(outcome.succeeded).toBe(false);
    expect(outcome.attempts).toBe(MAX_RETRIES + 1);
    expect(outcome.lastError?.message).toBe('permanent failure');
    expect(recordedDelays).toEqual([...RETRY_DELAYS_MS]);
  });
});
