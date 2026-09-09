import { Injectable } from '@nestjs/common';
import { CardAlreadyExistsError, CardRequest } from '@card-domain/index';
import { Prisma, PrismaService } from '@database/index';
import { CardRequestWriter } from '../../application/ports/card-request-writer.port';

@Injectable()
export class PrismaCardRequestWriter implements CardRequestWriter {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOutboxEvent(
    cardRequest: CardRequest,
    eventType: string,
    eventPayload: Record<string, unknown>,
  ): Promise<void> {
    const snapshot = cardRequest.toSnapshot();
    try {
      await this.prisma.$transaction([
        this.prisma.cardRequest.create({
          data: {
            id: snapshot.id,
            requestId: snapshot.requestId,
            documentType: snapshot.documentType,
            documentNumber: snapshot.documentNumber,
            fullName: snapshot.fullName,
            age: snapshot.age,
            email: snapshot.email,
            cardType: snapshot.cardType,
            currency: snapshot.currency,
            status: snapshot.status,
            forceError: snapshot.forceError,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          },
        }),
        this.prisma.outboxEvent.create({
          data: {
            aggregateId: snapshot.requestId,
            eventType,
            payload: eventPayload as Prisma.InputJsonValue,
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CardAlreadyExistsError(snapshot.documentNumber);
      }
      throw error;
    }
  }
}
