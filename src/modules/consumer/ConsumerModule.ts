import { Module } from '@nestjs/common';
import { ConsumerController } from './controller/ConsumerController';
import { PaymentService } from '../payment/service/PaymentService';
import { CreatePaymentService } from '../payment/service/CreatePaymentService';
import { RefundPaymentService } from '../payment/service/RefundPaymentService';
import { AmountCaptureService } from '../payment/service/AmountCaptureService';
import { FindPaymentByIdService } from '../payment/service/FindPaymentByIdService';
import { FindPaymentByReservationService } from '../payment/service/FindPaymentByReservationService';
import { CardPayment } from '../payment/strategies/CardPayment';
import { BoletoPayment } from '../payment/strategies/BoletoPayment';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { env } from 'process';
import { PaymentRepository } from '../payment/repository/PaymentRepository';

@Module({
  controllers: [ConsumerController],
  providers: [
    PaymentService,
    CreatePaymentService,
    RefundPaymentService,
    AmountCaptureService,
    FindPaymentByIdService,
    FindPaymentByReservationService,
    CardPayment,
    BoletoPayment,
    PaymentRepository,
    {
      provide: STRIPE_CLIENT,
      useFactory: () =>
        new Stripe(env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2025-12-15.clover',
        }),
    },
  ],
})
export class ConsumerModule {}
