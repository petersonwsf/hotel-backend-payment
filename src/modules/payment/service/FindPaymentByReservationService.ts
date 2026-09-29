import { Inject, Injectable } from '@nestjs/common';
import { ReservationPaymentNotFound } from '../domain/errors/ReservationPaymentNotFound';
import { PaymentRepository } from '../repository/PaymentRepository';
import { InvalidId } from '../domain/errors/InvalidId';
import { Payment } from '@prisma/client';
import { isNumber } from 'src/common/utils/isNumber';
import { PaymentDetails } from '../dtos/PaymentDetails';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';

@Injectable()
export class FindPaymentByReservationService {
  constructor(
    private readonly repository: PaymentRepository,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  async execute(reservationId: string): Promise<PaymentDetails> {
    if (!isNumber(reservationId)) throw new InvalidId();

    const payments: Payment[] = await this.repository.findReservationPayments(
      Number(reservationId),
    );

    if (payments.length == 0) throw new ReservationPaymentNotFound();

    const lastPayment = payments[payments.length - 1];

    const stripePaymentIntent = await this.stripe.paymentIntents.retrieve(
      lastPayment.stripePaymentIntentId,
    );

    const payment: PaymentDetails = {
      id: lastPayment.id,
      amount: stripePaymentIntent.amount,
      captureMethod: lastPayment.captureMethod,
      reservationId: lastPayment.reservationId,
      status: stripePaymentIntent.status,
      amountAuthorized: lastPayment.amountAuthorized,
      amountCaptured: lastPayment.amountCaptured,
      currency: lastPayment.currency,
      createdAt: lastPayment.createdAt,
      updatedAt: lastPayment.updatedAt,
      codeBar: lastPayment.codeBar ?? undefined,
      boletoUrl: lastPayment.boletoUrl ?? undefined,
      stripePaymentIntentId: lastPayment.stripePaymentIntentId,
      clientEmail: lastPayment.clientEmail,
      clientName: lastPayment.clientName,
      clientSecret: stripePaymentIntent.client_secret,
    };

    return payment;
  }
}
