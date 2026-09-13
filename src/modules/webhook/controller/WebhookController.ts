import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import Stripe from 'stripe';
import { env } from 'process';
import { ProcessWebhookService } from '../service/ProcessWebhookService';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { PaymentSSEService } from '../service/PaymentSSEService';
import { UserDTO } from 'src/modules/payment/dtos/UserDTO';

@Controller('webhook')
export class WebhookController {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly service: ProcessWebhookService,
    private readonly paymentSse: PaymentSSEService,
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

  @Sse('/sse/:reservationId')
  @UseGuards(AuthGuard('jwt'))
  observePayments(@Req() req: Request): Observable<MessageEvent> {
    const user = req.user as UserDTO;
    const reservationId = req.params.reservationId;
    return this.paymentSse.getPaymentsStreamForUser(
      Number(reservationId),
      user.id,
    );
  }
}
