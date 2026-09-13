import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { env } from 'process';
import { ProcessWebhookService } from '../service/ProcessWebhookService';
import { RABBITMQ_SERVICE } from 'src/common/rabbitmq/rabbitmq.constants';
import { ClientProxy } from '@nestjs/microservices';
import { SendMessageBroker } from '../service/SendMessageBroker';

@Controller('webhook')
export class WebhookController {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly service: ProcessWebhookService,
    private readonly rabbit: SendMessageBroker,
  ) {}

  @Post('/confirm')
  async processWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Request body not found!');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (error) {
      throw new BadRequestException(`Signature validation failed ${error}`);
    }

    await this.service.execute(event);

    return { received: true };
  }

  @Post('/test')
  async testRabbit() {
    await this.rabbit.test();
  }
}
