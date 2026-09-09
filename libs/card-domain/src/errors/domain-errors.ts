export class CardAlreadyExistsError extends Error {
  readonly code = 'CARD_ALREADY_EXISTS';

  constructor(documentNumber: string) {
    super(`A card request already exists for document ${documentNumber}`);
    this.name = 'CardAlreadyExistsError';
  }
}

export class CardRequestNotFoundError extends Error {
  readonly code = 'CARD_REQUEST_NOT_FOUND';

  constructor(requestId: string) {
    super(`Card request ${requestId} was not found`);
    this.name = 'CardRequestNotFoundError';
  }
}

export class CardIssuerError extends Error {
  readonly code = 'CARD_ISSUER_FAILED';

  constructor(reason: string) {
    super(reason);
    this.name = 'CardIssuerError';
  }
}

export class InvalidCardRequestError extends Error {
  readonly code = 'INVALID_CARD_REQUEST';

  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidCardRequestError';
  }
}
