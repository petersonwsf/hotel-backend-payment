import { CaptureMethod } from '@prisma/client';

export interface PaymentDetails {
  id: number;
  stripePaymentIntentId: string;
  clientSecret: string | null;
  reservationId: number;
  amount: number;
  amountAuthorized: number;
  amountCaptured: number;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  status: string;
  clientEmail: string;
  clientName: string;
  captureMethod: CaptureMethod;
  codeBar?: string | null;
  boletoUrl?: string | null;
}
