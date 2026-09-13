import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ReservationEventTypes } from '../types/EventTypes';
import { PaymentService } from 'src/modules/payment/service/PaymentService';
import type {
  MessageDataEnvelope,
  ReservationDataMessage,
} from '../types/ReservationMessage';
import { PaymentNotFound } from 'src/modules/payment/domain/errors/PaymentNotFound';
import { PaymentNotBelongUser } from 'src/modules/payment/domain/errors/PaymentNotBelongUser';
import { PaymentCannotBeRefunded } from 'src/modules/payment/domain/errors/PaymentCannotBeRefunded';
import { ReservationPaymentNotFound } from 'src/modules/payment/domain/errors/ReservationPaymentNotFound';

@Controller()
export class ConsumerController {
  private readonly logger = new Logger(ConsumerController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern(ReservationEventTypes.RESERVATION_CANCELLED)
  async handleCancelReservation(
    @Payload() data: MessageDataEnvelope<ReservationDataMessage>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `Processando evento '${data.eventType}' | correlationId: ${data.correlationId}`,
      );

      const payment = await this.paymentService.findByReservationId(
        data.data.id.toString(),
      );

      if (payment) {
        await this.paymentService.refund({
          id: payment.id.toString(),
          user: data.data.user,
        });
      }

      channel.ack(originalMsg);
    } catch (error) {
      if (
        error instanceof PaymentNotFound ||
        error instanceof PaymentNotBelongUser ||
        error instanceof PaymentCannotBeRefunded ||
        error instanceof ReservationPaymentNotFound
      ) {
        this.logger.warn(
          `Evento '${data?.eventType}' descartado devido a erro de negócio irrecuperável: ${error.message} | correlationId: ${data?.correlationId}`,
        );
        channel.ack(originalMsg);
      } else {
        this.logger.error(
          `Erro operacional ao processar evento '${data?.eventType}': ${error}`,
        );
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
