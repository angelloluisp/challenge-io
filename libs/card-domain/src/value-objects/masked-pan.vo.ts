export class MaskedPan {
  private constructor(private readonly value: string) {}

  static fromFullCardNumber(cardNumber: string): MaskedPan {
    const lastFour = cardNumber.slice(-4);
    return new MaskedPan(`**** **** **** ${lastFour}`);
  }

  toString(): string {
    return this.value;
  }
}
