import Stripe from 'stripe';
import { ClientDataDTO } from '../../dtos/ClientDataDTO';

export interface PaymentResult {
  paymentIntent: Stripe.PaymentIntent;
  boletoUrl: string | undefined;
  codeBar: string | undefined;
}

export interface IPayementStrategy {
  createPayment(data: any, client: ClientDataDTO): Promise<PaymentResult>;
}
