import { Injectable } from '@nestjs/common';
import { CreatePaymentService } from './CreatePaymentService';
import { AmountCaptureService } from './AmountCaptureService';
import { RefundPaymentService } from './RefundPaymentService';
import { FindPaymentByIdService } from './FindPaymentByIdService';
import { FindPaymentByReservationService } from './FindPaymentByReservationService';
import { CreatePaymentIntent } from '../dtos/CreatePaymentIntent';
import { UserDTO } from '../dtos/UserDTO';
import { PaymentCaptureDTO } from '../dtos/PaymentCaptureDTO';

@Injectable()
export class PaymentService {
  constructor(
    private readonly createService: CreatePaymentService,
    private readonly findPaymentByReservationService: FindPaymentByReservationService,
    private readonly findPaymentByIdService: FindPaymentByIdService,
    private readonly refundPaymentService: RefundPaymentService,
    private readonly capturePaymentService: AmountCaptureService,
  ) {}

  async create(data: CreatePaymentIntent, token: string) {
    return await this.createService.execute(data, token);
  }

  async findById(id: string) {
    return await this.findPaymentByIdService.execute(id);
  }

  async findByReservationId(reservationId: string) {
    return await this.findPaymentByReservationService.execute(reservationId);
  }

  async refund(data: { id: string; user: UserDTO }) {
    return await this.refundPaymentService.execute(data);
  }

  async capture(data: PaymentCaptureDTO, token: string) {
    return await this.capturePaymentService.execute(data, token);
  }
}
