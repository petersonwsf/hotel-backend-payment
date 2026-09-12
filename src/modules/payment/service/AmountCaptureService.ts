import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { PaymentRepository } from '../repository/PaymentRepository';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { PaymentCaptureDTO } from '../dtos/PaymentCaptureDTO';
import * as zod from 'zod';
import { Method } from '../domain/enums/Method';
import {
  IPayementStrategy,
  PaymentResult,
} from '../strategies/interfaces/IPaymentStrategy';
import { CardPayment } from '../strategies/CardPayment';
import { BoletoPayment } from '../strategies/BoletoPayment';
import { CaptureMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PaymentAutomaticCapture } from '../domain/errors/PaymentAutomaticCapture';
import { PaymentCannotBeCaptured } from '../domain/errors/PaymentCannotBeCaptured';
import { PaymentNotAuthorized } from '../domain/errors/PaymentNotAuthorized';
import { AmountZero } from '../domain/errors/AmountZero.error';
import { ValueAbovePermitted } from '../domain/errors/ValueAbovePermitted';
import { StripeError } from '../domain/errors/StripeError';
import { PaymentNotBelongUser } from '../domain/errors/PaymentNotBelongUser';
import { Logger } from '@nestjs/common';
import { ClientDataDTO } from '../dtos/ClientDataDTO';
import { getClientData } from 'src/common/http/aplicationHotel.client';

const validationSchema = zod.object({
  id: zod.coerce.number().int(),
  user: zod.object({
    id: zod.coerce.number().int(),
    username: zod.string(),
    role: zod.string(),
  }),
  userId: zod.coerce.number().int(),
  amount: zod.coerce.number(),
  method: zod.nativeEnum(Method).optional(),
});

const INVALID_CAPTURE_STATUS: PaymentStatus[] = [
  PaymentStatus.CAPTURED,
  PaymentStatus.REFUNDED,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELED,
];

@Injectable()
export class AmountCaptureService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly repository: PaymentRepository,
    private readonly card: CardPayment,
    private readonly boleto: BoletoPayment,
  ) {}
  private readonly logger = new Logger(AmountCaptureService.name);

  async execute(data: PaymentCaptureDTO, token: string) {
    const dataValid = validationSchema.parse(data);

    const valueInCents = Math.round(dataValid.amount * 100);

    const payment = await this.repository.findPaymentById(dataValid.id);

    if (!payment) throw new PaymentNotFound();

    if (dataValid.user.role != 'ADMIN') {
      if (payment.userId != dataValid.userId) throw new PaymentNotBelongUser();
    }

    if (payment.captureMethod != CaptureMethod.MANUAL)
      throw new PaymentAutomaticCapture();

    if (INVALID_CAPTURE_STATUS.includes(payment.status))
      throw new PaymentCannotBeCaptured();

    if (payment.status != PaymentStatus.AUTHORIZED)
      throw new PaymentNotAuthorized();

    if (valueInCents <= 0) throw new AmountZero();

    if (valueInCents > payment.amountAuthorized)
      throw new ValueAbovePermitted();

    const captured: Stripe.PaymentIntent =
      await this.stripe.paymentIntents.capture(payment.stripePaymentIntentId, {
        amount_to_capture: valueInCents,
      });
    this.logger.log(
      `Payment Intent with ID ${payment.stripePaymentIntentId} captured successfully for amount ${valueInCents} cents`,
    );

    if (captured.status != 'succeeded')
      throw new StripeError('Payment not succeeded, wait a minute!');

    const amountReceived = captured.amount_received ?? valueInCents;

    await this.repository.update(payment.id, {
      status: PaymentStatus.CAPTURED,
      amountCaptured: amountReceived,
    });

    const remainder = payment.amountAuthorized - amountReceived;

    if (remainder > 0) {
      if (!dataValid.method)
        throw new BadRequestException(
          'A payment method is required in case of incomplete payment!',
        );

      const paymentMethod: IPayementStrategy =
        dataValid.method === Method.CARTAO ? this.card : this.boleto;

      const captureMethod =
        paymentMethod instanceof CardPayment
          ? CaptureMethod.MANUAL
          : CaptureMethod.AUTOMATIC;

      const client: ClientDataDTO = await getClientData(payment.userId, token);

      const stripeNewPayment: PaymentResult = await paymentMethod.createPayment(
        {
          amount: remainder,
          currency: payment.currency,
          reservationId: payment.reservationId,
        },
        client,
      );

      this.logger.log(
        `New payment intent with ID ${stripeNewPayment.paymentIntent.id} created successfully for amount ${remainder} cents`,
      );

      const newPayment: Prisma.PaymentCreateInput = {
        amountAuthorized: remainder,
        currency: payment.currency,
        userId: dataValid.userId,
        reservationId: payment.reservationId,
        captureMethod: captureMethod,
        status: PaymentStatus.CREATED,
        stripePaymentIntentId: stripeNewPayment.paymentIntent.id,
        boletoUrl: stripeNewPayment.boletoUrl,
        codeBar: stripeNewPayment.codeBar,
      };

      const paymentRecord = await this.repository.create(newPayment);

      return paymentRecord;
    }

    const newPayment = {
      ...payment,
      amountCaptured: amountReceived,
      status: PaymentStatus.CAPTURED,
    };

    return newPayment;
  }
}
