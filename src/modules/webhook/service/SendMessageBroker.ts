import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_SERVICE } from 'src/common/rabbitmq/rabbitmq.constants';
import {
  PaymentDataBase,
  PaymentEventEnvelope,
  PaymentEventType,
} from '../dto/PaymentMessageBroker';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SendMessageBroker {
  constructor(
    @Inject(RABBITMQ_SERVICE) private readonly rabbitmq: ClientProxy,
  ) {}

  async send(
    eventId: string,
    binding: PaymentEventType,
    data: PaymentDataBase,
    correlationId?: string,
  ) {
    const payload: PaymentEventEnvelope = {
      eventId,
      eventType: binding,
      eventVersion: '1.0',
      occurredAt: new Date().toISOString(),
      source: 'payments-service',
      correlationId,
      data,
    };
    await firstValueFrom(this.rabbitmq.emit(binding, payload));
  }
}
