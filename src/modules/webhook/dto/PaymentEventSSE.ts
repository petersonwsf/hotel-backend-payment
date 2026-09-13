import { Payment } from '@prisma/client';

export interface PaymentEventSSE {
  userId: number;
  reservationId: number;
  payment: Payment;
}
