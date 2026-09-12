import { Inject, Injectable } from '@nestjs/common';
import * as z from 'zod';
import { AmountZero } from '../domain/errors/AmountZero.error';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { Prisma } from '@prisma/client';
import { PaymentStatus, CaptureMethod } from '@prisma/client';
import { PaymentRepository } from '../repository/PaymentRepository';
import { Method } from '../domain/enums/Method';
import {
  IPayementStrategy,
  PaymentResult,
} from '../strategies/interfaces/IPaymentStrategy';
import { CardPayment } from '../strategies/CardPayment';
import { BoletoPayment } from '../strategies/BoletoPayment';
import { CreatePaymentIntent } from '../dtos/CreatePaymentIntent';
import { Logger } from '@nestjs/common';
import { PaymentDetails } from '../dtos/PaymentDetails';

const schemaValidation = z.object({
  reservationId: z.number(),
  amount: z.number(),
  userId: z.number().int(),
  method: z.enum(Method),
  currency: z.string().optional(),
  customerEmail: z.string().optional(),
});

@Injectable()
export class CreatePaymentService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly repository: PaymentRepository,
    private readonly card: CardPayment,
    private readonly boleto: BoletoPayment,
  ) {}

  private readonly logger = new Logger(CreatePaymentService.name);

  async execute(data: CreatePaymentIntent): Promise<PaymentDetails> {
    const dataValid = schemaValidation.parse(data);

    if (dataValid.amount <= 0) throw new AmountZero();

    const valueInCents = Math.round(dataValid.amount * 100);

    dataValid.amount = valueInCents;

    const paymentMethod: IPayementStrategy =
      dataValid.method === Method.CARTAO ? this.card : this.boleto;

    const captureMethod =
      paymentMethod instanceof CardPayment
        ? CaptureMethod.MANUAL
        : CaptureMethod.AUTOMATIC;

    const paymentIntent: PaymentResult =
      await paymentMethod.createPayment(dataValid);
    this.logger.log(
      `Payment Intent created successfully with ID ${paymentIntent.paymentIntent.id} for reservation ID ${dataValid.reservationId} and amount ${dataValid.amount} cents`,
    );

    const paymentData: Prisma.PaymentCreateInput = {
      reservationId: dataValid.reservationId,
      stripePaymentIntentId: paymentIntent.paymentIntent.id,
      userId: dataValid.userId,
      amountAuthorized: valueInCents,
      amountCaptured: 0,
      status: PaymentStatus.CREATED,
      captureMethod: captureMethod,
      boletoUrl: paymentIntent.boletoUrl ?? null,
      codeBar: paymentIntent.codeBar ?? null,
    };

    const payment = await this.repository.create(paymentData);
    this.logger.log(
      `Payment created successfully with ID ${payment.id} for reservation ID ${dataValid.reservationId} in DB`,
    );

    return {
      ...payment,
      status: paymentIntent.paymentIntent.status,
      clientSecret: paymentIntent.paymentIntent.client_secret,
      amount: valueInCents,
    };
  }
}
