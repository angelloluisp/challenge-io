export const CARD_STATUS_READER = Symbol('CARD_STATUS_READER');

export interface CardStatusReader {
  findCardByRequestId(
    requestId: string,
  ): Promise<{ maskedPan: string; expirationDate: string } | null>;
}
