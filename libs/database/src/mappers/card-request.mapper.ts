import {
  CardRequest,
  CardRequestStatus,
  CardType,
  Currency,
  DocumentType,
} from '@card-domain/index';
import { CardRequest as PrismaCardRequest } from '../generated';

export function toDomainCardRequest(record: PrismaCardRequest): CardRequest {
  return CardRequest.restore({
    id: record.id,
    requestId: record.requestId,
    documentType: record.documentType as DocumentType,
    documentNumber: record.documentNumber,
    fullName: record.fullName,
    age: record.age,
    email: record.email,
    cardType: record.cardType as CardType,
    currency: record.currency as Currency,
    status: record.status as CardRequestStatus,
    forceError: record.forceError,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
