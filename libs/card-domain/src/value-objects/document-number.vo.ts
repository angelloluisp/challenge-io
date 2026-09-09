const PERUVIAN_DNI_PATTERN = /^\d{8}$/;

export class DocumentNumber {
  private constructor(private readonly value: string) {}

  static create(rawValue: string): DocumentNumber {
    if (!PERUVIAN_DNI_PATTERN.test(rawValue)) {
      throw new Error('Invalid DNI format, expected 8 numeric digits');
    }
    return new DocumentNumber(rawValue);
  }

  toString(): string {
    return this.value;
  }

  masked(): string {
    return `${this.value.slice(0, 2)}****${this.value.slice(-2)}`;
  }
}
