import { Injectable } from '@nestjs/common';
import { CardRequestStatus } from '@card-domain/index';
import { PrismaService } from '@database/index';
import { CardIssuanceWriter } from '../../application/ports/card-issuance-writer.port';

@Injectable()
export class PrismaCardIssuanceWriter implements CardIssuanceWriter {
  constructor(private readonly prisma: PrismaService) {}

  async markProcessing(requestId: string): Promise<void> {
    await this.prisma.cardRequest.update({
      where: { requestId },
      data: { status: CardRequestStatus.PROCESSING },
    });
  }

  async markIssued(input: {
    requestId: string;
    customerDocument: string;
    maskedPan: string;
    expirationDate: string;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cardRequest.update({
        where: { requestId: input.requestId },
        data: { status: CardRequestStatus.ISSUED },
      }),
      this.prisma.card.create({
        data: {
          requestId: input.requestId,
          customerDocument: input.customerDocument,
          maskedPan: input.maskedPan,
          expirationDate: input.expirationDate,
        },
      }),
    ]);
  }

  async markFailed(requestId: string): Promise<void> {
    await this.prisma.cardRequest.update({
      where: { requestId },
      data: { status: CardRequestStatus.FAILED },
    });
  }
}
