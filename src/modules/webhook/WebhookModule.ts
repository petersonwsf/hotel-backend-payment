import { Module } from '@nestjs/common';
import { WebhookController } from './controller/WebhookController';
import { ProcessWebhookService } from './service/ProcessWebhookService';
import { WebhookRepository } from './repository/WebhookRepository';
import { PaymentModule } from '../payment/PaymentModule';
import { env } from 'process';
import { ProccessWebhookSchedule } from './service/ProccessWebhookSchedule';
import { SendMessageBroker } from './service/SendMessageBroker';
import { PaymentRepository } from '../payment/repository/PaymentRepository';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { RabbitMQConnectionProvider } from 'src/common/rabbitmq/rabbitmq.provider';
import { RabbitMQChannelProvider } from 'src/common/rabbitmq/rabbitmq-channel.provider';

@Module({
  controllers: [WebhookController],
  providers: [
    ProcessWebhookService,
    PaymentRepository,
    WebhookRepository,
    SendMessageBroker,
    ProccessWebhookSchedule,
    RabbitMQConnectionProvider,
    RabbitMQChannelProvider,
    {
      provide: STRIPE_CLIENT,
      useFactory: () =>
        new Stripe(env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2025-12-15.clover',
        }),
    },
  ],
  imports: [PaymentModule],
})
export class WebhookModule {}
