export const SLEEPER = Symbol('SLEEPER');

export interface Sleeper {
  sleep(milliseconds: number): Promise<void>;
}

export class RealSleeper implements Sleeper {
  sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

export class ImmediateSleeper implements Sleeper {
  sleep(): Promise<void> {
    return Promise.resolve();
  }
}
