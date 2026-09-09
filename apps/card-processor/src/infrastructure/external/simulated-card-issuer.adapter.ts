import { Injectable } from '@nestjs/common';
import { CardIssuerError } from '@card-domain/index';
import { Sleeper } from '@shared/index';
import {
  CardIssuerPort,
  ExternalCardIssuanceCommand,
  ExternalCardIssuanceResult,
} from '../../application/ports/card-issuer.port';

const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 500;
const RANDOM_FAILURE_RATE = 0.3;

@Injectable()
export class SimulatedCardIssuerAdapter implements CardIssuerPort {
  constructor(private readonly sleeper: Sleeper) {}

  async issueCard(command: ExternalCardIssuanceCommand): Promise<ExternalCardIssuanceResult> {
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    await this.sleeper.sleep(delay);

    if (command.forceError) {
      throw new CardIssuerError(`Forced failure for request ${command.requestId}`);
    }
    if (Math.random() < RANDOM_FAILURE_RATE) {
      throw new CardIssuerError(`External card issuer rejected request ${command.requestId}`);
    }

    return {
      cardId: this.randomDigits(12),
      cardNumber: `4${this.randomDigits(15)}`,
      expirationDate: this.futureExpirationDate(),
      cvv: this.randomDigits(3),
    };
  }

  private randomDigits(length: number): string {
    let digits = '';
    for (let i = 0; i < length; i += 1) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    return digits;
  }

  private futureExpirationDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() + 4).slice(-2);
    return `${month}/${year}`;
  }
}
