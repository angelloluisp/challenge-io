import { CardRequestStatus, CardType, Currency, DocumentType } from '../enums';

export interface CardRequestProps {
  id: string;
  requestId: string;
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
  cardType: CardType;
  currency: Currency;
  status: CardRequestStatus;
  forceError: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CardRequest {
  private constructor(private props: CardRequestProps) {}

  static create(props: Omit<CardRequestProps, 'status' | 'createdAt' | 'updatedAt'>): CardRequest {
    const now = new Date();
    return new CardRequest({
      ...props,
      status: CardRequestStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: CardRequestProps): CardRequest {
    return new CardRequest(props);
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get documentNumber(): string {
    return this.props.documentNumber;
  }

  get status(): CardRequestStatus {
    return this.props.status;
  }

  get forceError(): boolean {
    return this.props.forceError;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): string {
    return this.props.email;
  }

  get cardType(): CardType {
    return this.props.cardType;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  get documentType(): DocumentType {
    return this.props.documentType;
  }

  get age(): number {
    return this.props.age;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsProcessing(): void {
    this.props.status = CardRequestStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  markAsIssued(): void {
    this.props.status = CardRequestStatus.ISSUED;
    this.props.updatedAt = new Date();
  }

  markAsFailed(): void {
    this.props.status = CardRequestStatus.FAILED;
    this.props.updatedAt = new Date();
  }

  toSnapshot(): CardRequestProps {
    return { ...this.props };
  }
}
