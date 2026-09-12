import Stripe from 'stripe';
import {
  IPayementStrategy,
  PaymentResult,
} from './interfaces/IPaymentStrategy';
import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { ClientDataDTO } from '../dtos/ClientDataDTO';

@Injectable()
export class BoletoPayment implements IPayementStrategy {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  async createPayment(
    data: any,
    client: ClientDataDTO,
  ): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency ?? 'brl',
      payment_method_types: ['boleto'],
      confirm: true,
      payment_method_data: {
        type: 'boleto',
        boleto: {
          tax_id: client.pin,
        },
        billing_details: {
          name: client.name,
          email: client.email,
          address: {
            line1: `${client.contactInformation.street}, ${client.contactInformation.number ?? 'S/N'}`,
            city: client.contactInformation.city,
            state: client.contactInformation.state,
            postal_code: client.contactInformation.postalCode,
            country: 'BR',
          }
        },
      },
      payment_method_options: {
        boleto: {
          expires_after_days: 5,
        },
      },
      metadata: {
        reservationId: String(data.reservationId),
        client: JSON.stringify(client),
      },
    });

    // 2. Como passamos 'confirm: true', o next_action já vem preenchido direto aqui!
    const boletoDetails = paymentIntent.next_action?.boleto_display_details;

    return {
      paymentIntent: paymentIntent,
      boletoUrl: boletoDetails!.hosted_voucher_url!,
      codeBar: boletoDetails!.number!,
    };
  }
}
