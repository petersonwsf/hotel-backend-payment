import { Inject, Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { env } from 'process';
import { RABBITMQ_CHANNEL } from 'src/common/rabbitmq/rabbitmq.constants';
import {
  PaymentDataBase,
  PaymentEventEnvelope,
  PaymentEventType,
} from '../dto/PaymentMessageBroker';

@Injectable()
export class SendMessageBroker {
  private readonly logger = new Logger(SendMessageBroker.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: amqp.ChannelWrapper,
  ) {}

  async send(
    eventId: string,
    binding: PaymentEventType,
    data: PaymentDataBase,
    correlationId?: string,
  ) {
    const envelope: PaymentEventEnvelope = {
      eventId,
      eventType: binding,
      eventVersion: '1.0',
      occurredAt: new Date().toISOString(),
      source: 'payments-service',
      correlationId,
      data,
    };

    const payloadWithPattern = {
      pattern: binding,
      data: envelope,
    };

    await this.channel.publish(
      env.EXCHANGE_NAME ?? 'payments.topic',
      binding,
      payloadWithPattern,
    );

    this.logger.log(
      `Mensagem publicada com routing key "\({binding}" e pattern "\){binding}"`,
    );
  }
}