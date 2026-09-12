import Stripe from 'stripe';
import {
  IPayementStrategy,
  PaymentResult,
} from './interfaces/IPaymentStrategy';
import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { ClientDataDTO } from '../dtos/ClientDataDTO';

@Injectable()
export class CardPayment implements IPayementStrategy {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  async createPayment(
    data: any,
    client: ClientDataDTO,
  ): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency ?? 'brl',
      capture_method: 'manual',
      payment_method_types: ['card'],
      metadata: {
        reservationId: String(data.reservationId),
        client: JSON.stringify(client),
      },
    });

    return {
      paymentIntent,
      boletoUrl: undefined,
      codeBar: undefined,
    };
  }
}
