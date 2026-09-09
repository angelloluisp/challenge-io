export const CARD_ISSUANCE_WRITER = Symbol('CARD_ISSUANCE_WRITER');

export interface CardIssuanceWriter {
  markProcessing(requestId: string): Promise<void>;

  markIssued(input: {
    requestId: string;
    customerDocument: string;
    maskedPan: string;
    expirationDate: string;
  }): Promise<void>;

  markFailed(requestId: string): Promise<void>;
}
