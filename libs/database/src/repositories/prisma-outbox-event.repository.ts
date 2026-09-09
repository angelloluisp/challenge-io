import { Injectable } from '@nestjs/common';
import { OutboxEventRecord, OutboxEventRepository, OutboxEventStatus } from '@card-domain/index';
import { Prisma } from '../generated';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaOutboxEventRepository implements OutboxEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingBatch(limit: number): Promise<OutboxEventRecord[]> {
    const records = await this.prisma.outboxEvent.findMany({
      where: { status: OutboxEventStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return records.map((record) => ({
      id: record.id,
      aggregateId: record.aggregateId,
      eventType: record.eventType,
      payload: record.payload as Record<string, unknown>,
      status: record.status as OutboxEventStatus,
      attempts: record.attempts,
      createdAt: record.createdAt,
      publishedAt: record.publishedAt,
    }));
  }

  async markAsPublished(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: OutboxEventStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  static buildCreateInput(
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Prisma.OutboxEventUncheckedCreateInput {
    return {
      aggregateId,
      eventType,
      payload: payload as Prisma.InputJsonValue,
    };
  }
}
