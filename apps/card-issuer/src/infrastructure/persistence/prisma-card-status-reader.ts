import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/index';
import { CardStatusReader } from '../../application/ports/card-status-reader.port';

@Injectable()
export class PrismaCardStatusReader implements CardStatusReader {
  constructor(private readonly prisma: PrismaService) {}

  async findCardByRequestId(
    requestId: string,
  ): Promise<{ maskedPan: string; expirationDate: string } | null> {
    const card = await this.prisma.card.findUnique({ where: { requestId } });
    if (!card) {
      return null;
    }
    return { maskedPan: card.maskedPan, expirationDate: card.expirationDate };
  }
}
