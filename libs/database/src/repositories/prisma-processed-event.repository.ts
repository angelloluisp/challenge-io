import { Injectable } from '@nestjs/common';
import { ProcessedEventRepository } from '@card-domain/index';
import { Prisma } from '../generated';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaProcessedEventRepository implements ProcessedEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async wasProcessed(eventId: string, eventSource: string): Promise<boolean> {
    const record = await this.prisma.processedEvent.findUnique({
      where: { eventId_eventSource: { eventId, eventSource } },
    });
    return record !== null;
  }

  async markAsProcessed(eventId: string, eventSource: string, eventType: string): Promise<void> {
    try {
      await this.prisma.processedEvent.create({
        data: { eventId, eventSource, eventType },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return;
      }
      throw error;
    }
  }
}
