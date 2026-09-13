import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { WebhookRepository } from '../repository/WebhookRepository';
import { SendMessageBroker } from './SendMessageBroker';
import {
  eventTypeToStatus,
  PaymentEventType,
} from '../dto/PaymentMessageBroker';
import { PaymentRepository } from 'src/modules/payment/repository/PaymentRepository';
import { toPaymentEventData } from 'utils/toPaymentEventData';
import { PaymentSSEService } from './PaymentSSEService';

@Injectable()
export class ProcessWebhookService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly repository: WebhookRepository,
    private readonly sendMessageBroker: SendMessageBroker,
    private readonly paymentSseService: PaymentSSEService,
  ) {}

  private readonly logger = new Logger(ProcessWebhookService.name);

  async execute(data: Stripe.Event) {
    const dataEvent = data;

    const dataObject = dataEvent.data.object as any;

    const reservationId = dataObject.metadata?.reservationId
      ? parseInt(dataObject.metadata.reservationId as string)
      : null;

    const webhookData: Prisma.StripeWebhookEventCreateInput = {
      stripeEventId: dataEvent.id,
      type: dataEvent.type,
      apiVersion: dataEvent.api_version,
      livemode: dataEvent.livemode,
      requestId: dataEvent.request?.id,
      idempotencyId: dataEvent.request?.idempotency_key,

      paymentIntentId:
        dataObject.payment_intent ||
        (dataObject.id?.startsWith('pi_') ? dataObject.id : null),
      reservationId: reservationId,
      payload: dataEvent as any,
      status: 'RECEIVED',
    };

    const existingEvent = await this.repository.findByStripeEventId(
      dataEvent.id,
    );

    if (existingEvent && existingEvent.status === 'PROCESSED') return;

    const webhook = existingEvent
      ? await this.repository.resetForRetry(existingEvent.id, dataEvent as any)
      : await this.repository.create(webhookData);

    try {
      switch (dataEvent.type) {
        case 'payment_intent.amount_capturable_updated':
          await this.publishPaymentEvent(
            PaymentEventType.PAYMENT_AUTHORIZED,
            webhook.paymentIntentId,
            dataEvent.id,
            webhook.idempotencyId,
          );
          break;
        case 'payment_intent.succeeded':
          await this.publishPaymentEvent(
            PaymentEventType.PAYMENT_CAPTURED,
            webhook.paymentIntentId,
            dataEvent.id,
            webhook.idempotencyId,
          );
          break;
        case 'charge.refunded':
          await this.publishPaymentEvent(
            PaymentEventType.PAYMENT_REFUNDED,
            webhook.paymentIntentId,
            dataEvent.id,
            webhook.idempotencyId,
          );
          break;
        case 'payment_intent.canceled':
          await this.publishPaymentEvent(
            PaymentEventType.PAYMENT_CANCELED,
            webhook.paymentIntentId,
            dataEvent.id,
            webhook.idempotencyId,
          );
          break;
        default:
          await this.repository.processWebhook(webhook.id, 'IGNORED');
          return;
      }
      await this.repository.processWebhook(webhook.id, 'PROCESSED');
    } catch (error: any) {
      await this.repository.processWebhook(webhook.id, 'FAILED', error.message);
      throw error;
    }
  }

  private async publishPaymentEvent(
    eventType: PaymentEventType,
    paymentIntentId: string | null,
    stripeEventId: string,
    correlationId?: string | null,
  ) {
    if (!paymentIntentId) return;

    const payment =
      await this.paymentRepository.findPaymentByStripePaymentIntentId(
        paymentIntentId,
      );

    if (!payment) {
      this.logger.warn(
        `Payment não encontrado para paymentIntentId=${paymentIntentId}`,
      );
      return;
    }

    const paymentUpdated = await this.paymentRepository.update(payment.id, {
      status: eventTypeToStatus[eventType],
    });

    const eventId = `${stripeEventId}:${eventType}`;

    await this.sendMessageBroker.send(
      eventId,
      eventType,
      toPaymentEventData(paymentUpdated),
      correlationId ?? undefined,
    );

    this.paymentSseService.notifyPaymentEvents({
      userId: paymentUpdated.userId,
      reservationId: paymentUpdated.reservationId,
      payment: paymentUpdated,
    });
  }
}
