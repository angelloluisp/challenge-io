import { CardType, Currency, DocumentType } from '@card-domain/index';

export interface IssueCardCommand {
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
  cardType: CardType;
  currency: Currency;
  forceError: boolean;
}
