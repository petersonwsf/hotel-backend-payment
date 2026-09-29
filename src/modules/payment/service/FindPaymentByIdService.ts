import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepository } from '../repository/PaymentRepository';
import { isNumber } from 'src/common/utils/isNumber';
import { InvalidId } from '../domain/errors/InvalidId';
import { PaymentDetails } from '../dtos/PaymentDetails';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { Logger } from '@nestjs/common';

@Injectable()
export class FindPaymentByIdService {
  constructor(
    private readonly repository: PaymentRepository,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  private readonly logger = new Logger(FindPaymentByIdService.name);

  async execute(id: string): Promise<PaymentDetails> {
    this.logger.log(`Finding payment with ID ${id}`);

    if (!isNumber(id)) throw new InvalidId();

    const payment = await this.repository.findPaymentById(Number(id));

    if (!payment) throw new PaymentNotFound();

    const stripePaymentIntent = await this.stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
    );
    this.logger.log(
      `Stripe Payment Intent with ID ${payment.stripePaymentIntentId} retrieved successfully`,
    );

    const paymentDetails: PaymentDetails = {
      id: payment.id,
      amount: stripePaymentIntent.amount,
      captureMethod: payment.captureMethod,
      reservationId: payment.reservationId,
      status: stripePaymentIntent.status,
      amountAuthorized: payment.amountAuthorized,
      amountCaptured: payment.amountCaptured,
      currency: payment.currency,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      codeBar: payment.codeBar ?? undefined,
      boletoUrl: payment.boletoUrl ?? undefined,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      clientEmail: payment.clientEmail,
      clientName: payment.clientName,
      clientSecret: stripePaymentIntent.client_secret,
    };

    return paymentDetails;
  }
}
