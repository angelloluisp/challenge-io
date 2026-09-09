import { Module } from '@nestjs/common';
import { CARD_REQUEST_REPOSITORY } from '@card-domain/index';
import { PrismaCardRequestRepository } from '@database/index';
import { CardsController } from './http/cards.controller';
import { IssueCardUseCase } from './application/use-cases/issue-card.use-case';
import { GetCardRequestStatusUseCase } from './application/use-cases/get-card-request-status.use-case';
import { CARD_REQUEST_WRITER } from './application/ports/card-request-writer.port';
import { CARD_STATUS_READER } from './application/ports/card-status-reader.port';
import { PrismaCardRequestWriter } from './infrastructure/persistence/prisma-card-request-writer';
import { PrismaCardStatusReader } from './infrastructure/persistence/prisma-card-status-reader';

@Module({
  controllers: [CardsController],
  providers: [
    IssueCardUseCase,
    GetCardRequestStatusUseCase,
    { provide: CARD_REQUEST_REPOSITORY, useClass: PrismaCardRequestRepository },
    { provide: CARD_REQUEST_WRITER, useClass: PrismaCardRequestWriter },
    { provide: CARD_STATUS_READER, useClass: PrismaCardStatusReader },
  ],
})
export class CardsModule {}
