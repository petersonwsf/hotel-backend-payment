import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ReservationEventTypes } from '../types/EventTypes';
import { PaymentService } from 'src/modules/payment/service/PaymentService';

@Controller()
export class ConsumerController {
  private readonly logger = new Logger(ConsumerController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern(ReservationEventTypes.RESERVATION_CANCELLED)
  async handleCancelReservation(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `Processando evento '${data.eventType}' | correlationId: ${data.correlationId}`,
      );

      console.log(data);

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Erro ao processar evento '${data?.eventType}': ${error}`,
      );

      // false, false = não reenvia pra fila (evita loop infinito de erro)
      // troque o segundo "false" pra "true" se quiser reenfileirar em caso de falha transitória
      channel.nack(originalMsg, false, false);
    }
  }
}