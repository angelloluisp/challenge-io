import { Injectable } from '@nestjs/common';
import { Card, CardRepository } from '@card-domain/index';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaCardRepository implements CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(card: Card): Promise<void> {
    const snapshot = card.toSnapshot();
    await this.prisma.card.create({
      data: {
        id: snapshot.id,
        requestId: snapshot.requestId,
        customerDocument: snapshot.customerDocument,
        maskedPan: snapshot.maskedPan,
        expirationDate: snapshot.expirationDate,
        status: snapshot.status,
        createdAt: snapshot.createdAt,
      },
    });
  }
}
