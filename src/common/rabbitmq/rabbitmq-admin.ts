import * as amqp from 'amqp-connection-manager';
import { env } from 'process';

async function setupTopology() {
  const connection = amqp.connect([env.RABBITMQ_URL ?? '']);
  const channel = connection.createChannel({
    json: true,
    setup: async (ch) => {
      await ch.assertExchange(env.EXCHANGE_NAME ?? 'payments.topic', 'topic', {
        durable: true,
      });
      await ch.assertQueue(env.QUEUE_NAME ?? 'reservation_events_queue', {
        durable: true,
      });
      await ch.bindQueue(
        env.QUEUE_NAME ?? 'reservation_events_queue',
        env.EXCHANGE_NAME ?? 'payments.topic',
        'reservation.*', // ou a routing key exata do evento
      );
    },
  });
  await channel.waitForConnect();
  await channel.close();
  await connection.close();
}
