export const CARD_ISSUER_PORT = Symbol('CARD_ISSUER_PORT');

export interface ExternalCardIssuanceCommand {
  requestId: string;
  documentNumber: string;
  forceError: boolean;
}

export interface ExternalCardIssuanceResult {
  cardId: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export interface CardIssuerPort {
  issueCard(command: ExternalCardIssuanceCommand): Promise<ExternalCardIssuanceResult>;
}
