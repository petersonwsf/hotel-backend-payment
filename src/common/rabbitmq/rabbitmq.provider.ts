// src/common/rabbitmq/rabbitmq.provider.ts
import { Provider } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { env } from 'process';
import { RABBITMQ_CONNECTION } from './rabbitmq.constants';

export const RabbitMQConnectionProvider: Provider = {
  provide: RABBITMQ_CONNECTION,
  useFactory: () => {
    return amqp.connect([env.RABBITMQ_URL ?? '']);
  },
};
