import { Provider } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { env } from 'process';
import { RABBITMQ_CONNECTION, RABBITMQ_CHANNEL } from './rabbitmq.constants';

export const RabbitMQChannelProvider: Provider = {
  provide: RABBITMQ_CHANNEL,
  useFactory: (connection: amqp.AmqpConnectionManager) => {
    return connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(
          env.EXCHANGE_NAME ?? 'payments.topic',
          'topic',
          { durable: true },
        );
      },
    });
  },
  inject: [RABBITMQ_CONNECTION],
};