import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as amqp from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { env } from 'process';
import 'dotenv/config';

/**
 * Garante que o exchange, a fila e o binding existam antes de começar
 * a consumir mensagens. Isso substitui o que o RabbitAdmin faz no lado Java.
 */
async function setupRabbitTopology() {
  const connection = amqp.connect([env.RABBITMQ_URL ?? '']);

  const channel = connection.createChannel({
    json: true,
    setup: async (ch: ConfirmChannel) => {
      const exchange = env.EXCHANGE_NAME ?? '';
      const queue = env.RABBIT_QUEUE ?? '';
      const routingKey = env.ROUTING_KEY ?? 'reservation.*';

      await ch.assertExchange(exchange, 'topic', { durable: true });
      await ch.assertQueue(queue, { durable: true });
      await ch.bindQueue(queue, exchange, routingKey);
    },
  });

  await channel.waitForConnect();
  await channel.close();
  await connection.close();
}

async function bootstrap() {
  // 1. Declara exchange/fila/bind antes de qualquer coisa
  await setupRabbitTopology();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['error', 'warn', 'log'],
      rawBody: true,
    },
  );

  // 2. Conecta o microservice RMQ (consumidor)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [env.RABBITMQ_URL ?? ''],
      queue: env.RABBIT_QUEUE ?? '',
      noAck: false,
      queueOptions: {
        durable: true,
      },
    },
  });

  // 3. Inicia o consumo das filas
  await app.startAllMicroservices();

  // 4. Sobe o servidor HTTP normalmente
  await app.listen(process.env.PORT ?? 3333, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
