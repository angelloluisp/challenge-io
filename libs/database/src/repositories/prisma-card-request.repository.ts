import { Injectable } from '@nestjs/common';
import { CardRequest, CardRequestRepository } from '@card-domain/index';
import { PrismaService } from '../prisma.service';
import { toDomainCardRequest } from '../mappers/card-request.mapper';

@Injectable()
export class PrismaCardRequestRepository implements CardRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRequestId(requestId: string): Promise<CardRequest | null> {
    const record = await this.prisma.cardRequest.findUnique({ where: { requestId } });
    return record ? toDomainCardRequest(record) : null;
  }

  async findByDocumentNumber(documentNumber: string): Promise<CardRequest | null> {
    const record = await this.prisma.cardRequest.findUnique({ where: { documentNumber } });
    return record ? toDomainCardRequest(record) : null;
  }

  async update(cardRequest: CardRequest): Promise<void> {
    const snapshot = cardRequest.toSnapshot();
    await this.prisma.cardRequest.update({
      where: { requestId: snapshot.requestId },
      data: {
        status: snapshot.status,
        updatedAt: snapshot.updatedAt,
      },
    });
  }
}
