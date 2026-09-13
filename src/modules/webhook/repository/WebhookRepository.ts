import { Prisma, WebhookProcessStatus } from '@prisma/client';
import { IWebhookRepository } from './IWebhookRepository';
import { prisma } from 'src/lib/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhookRepository implements IWebhookRepository {
  async create(data: Prisma.StripeWebhookEventCreateInput) {
    return await prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: data.stripeEventId },
      create: data,
      update: {},
    });
  }

  async findByStripeEventId(id: string) {
    const eventExisting = await prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: id },
    });
    return eventExisting;
  }

  async findByStatus(status: WebhookProcessStatus) {
    return await prisma.stripeWebhookEvent.findMany({
      where: { status: status },
    });
  }

  async resetForRetry(id: number, payload: Prisma.InputJsonValue) {
    return await prisma.stripeWebhookEvent.update({
      where: { id },
      data: {
        payload,
        status: 'RECEIVED',
        processedAt: null,
        errorMessage: null,
      },
    });
  }

  async update(id: number, data: Prisma.StripeWebhookEventUpdateInput) {
    return await prisma.stripeWebhookEvent.update({
      where: { id },
      data,
    });
  }

  async processWebhook(
    id: number,
    status: WebhookProcessStatus,
    errorMessage?: string,
  ) {
    await prisma.stripeWebhookEvent.update({
      where: { id },
      data: {
        status: status,
        processedAt: new Date(),
        errorMessage: errorMessage,
      },
    });
  }
}
