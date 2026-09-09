export enum DocumentType {
  DNI = 'DNI',
}

export enum CardType {
  VISA = 'VISA',
}

export enum Currency {
  PEN = 'PEN',
  USD = 'USD',
}

export enum CardRequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  ISSUED = 'ISSUED',
  FAILED = 'FAILED',
}

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
}
