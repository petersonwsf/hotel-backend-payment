import { Payment } from '@prisma/client';

export function toPaymentEventData(payment: Payment) {
  return {
    paymentId: payment.id,
    reservationId: payment.reservationId,
    userId: payment.userId,
    stripePaymentIntentId: payment.stripePaymentIntentId,
    amountAuthorized: payment.amountAuthorized,
    amountCaptured: payment.amountCaptured,
    currency: payment.currency,
    status: payment.status,
    captureMethod: payment.captureMethod,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
