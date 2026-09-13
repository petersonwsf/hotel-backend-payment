import { PaymentStatus } from '@prisma/client';
import { CaptureMethod } from '@prisma/client';

export enum PaymentEventType {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_REQUIRES_ACTION = 'payment.requires_action',
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_CANCELED = 'payment.canceled',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  BOLETO_GENERATED = 'boleto.generated',
}

export interface PaymentDataBase {
  paymentId: number;
  reservationId: number;
  userId: number;
  stripePaymentIntentId: string;
  amountAuthorized: number;
  amountCaptured: number;
  currency: string;
  status: PaymentStatus;
  captureMethod: CaptureMethod;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEventEnvelope<
  TType extends PaymentEventType = PaymentEventType,
> {
  eventId: string;
  eventType: TType;
  eventVersion: string;
  occurredAt: string;
  source: 'payments-service';
  correlationId?: string;
  data: PaymentDataBase;
}

export const eventTypeToStatus: Partial<
  Record<PaymentEventType, PaymentStatus>
> = {
  [PaymentEventType.PAYMENT_CREATED]: PaymentStatus.CREATED,
  [PaymentEventType.PAYMENT_CANCELED]: PaymentStatus.CANCELED,
  [PaymentEventType.PAYMENT_CAPTURED]: PaymentStatus.CAPTURED,
  [PaymentEventType.PAYMENT_REFUNDED]: PaymentStatus.REFUNDED,
  [PaymentEventType.PAYMENT_REQUIRES_ACTION]: PaymentStatus.REQUIRES_ACTION,
  [PaymentEventType.PAYMENT_AUTHORIZED]: PaymentStatus.AUTHORIZED,
  [PaymentEventType.PAYMENT_FAILED]: PaymentStatus.FAILED,
};
