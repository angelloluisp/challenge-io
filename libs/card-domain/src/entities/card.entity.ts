export interface CardProps {
  id: string;
  requestId: string;
  customerDocument: string;
  maskedPan: string;
  expirationDate: string;
  status: 'ISSUED';
  createdAt: Date;
}

export class Card {
  private constructor(private readonly props: CardProps) {}

  static create(props: Omit<CardProps, 'status' | 'createdAt'>): Card {
    return new Card({
      ...props,
      status: 'ISSUED',
      createdAt: new Date(),
    });
  }

  static restore(props: CardProps): Card {
    return new Card(props);
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get maskedPan(): string {
    return this.props.maskedPan;
  }

  get expirationDate(): string {
    return this.props.expirationDate;
  }

  get customerDocument(): string {
    return this.props.customerDocument;
  }

  toSnapshot(): CardProps {
    return { ...this.props };
  }
}
