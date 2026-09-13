import {
  Prisma,
  StripeWebhookEvent,
  WebhookProcessStatus,
} from '@prisma/client';

export interface IWebhookRepository {
  create(
    data: Prisma.StripeWebhookEventCreateInput,
  ): Promise<StripeWebhookEvent>;
  findByStripeEventId(id: string): Promise<StripeWebhookEvent | null>;
  findByStatus(status: WebhookProcessStatus): Promise<StripeWebhookEvent[]>;
  update(
    id: number,
    data: Prisma.StripeWebhookEventUpdateInput,
  ): Promise<StripeWebhookEvent>;
  resetForRetry(
    id: number,
    payload: Prisma.InputJsonValue,
  ): Promise<StripeWebhookEvent>;
  processWebhook(
    id: number,
    status: WebhookProcessStatus,
    errorMessage?: string,
  ): Promise<void>;
}
