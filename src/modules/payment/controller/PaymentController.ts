import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CreatePaymentIntent } from 'src/modules/payment/dtos/CreatePaymentIntent';
import * as zod from 'zod';
import { AmountZero } from '../domain/errors/AmountZero.error';
import { ReservationPaymentNotFound } from '../domain/errors/ReservationPaymentNotFound';
import { InvalidId } from '../domain/errors/InvalidId';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { PaymentCannotBeRefunded } from '../domain/errors/PaymentCannotBeRefunded';
import type { PaymentCaptureDTO } from '../dtos/PaymentCaptureDTO';
import { PaymentAutomaticCapture } from '../domain/errors/PaymentAutomaticCapture';
import { PaymentCannotBeCaptured } from '../domain/errors/PaymentCannotBeCaptured';
import { ValueAbovePermitted } from '../domain/errors/ValueAbovePermitted';
import { StripeError } from '../domain/errors/StripeError';
import { PaymentService } from '../service/PaymentService';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Logger } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('payment')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  private readonly logger: Logger = new Logger(PaymentController.name);

  @Post()
  @HttpCode(201)
  async createPaymentIntent(
    @Body() data: CreatePaymentIntent,
    @Headers('authorization') token: string,
  ) {
    try {
      const payment = await this.service.create(data, token);
      return { payment };
    } catch (error) {
      if (error instanceof zod.ZodError)
        throw new BadRequestException({ message: 'Dados inválidos' });
      if (error instanceof AmountZero)
        throw new BadRequestException({ message: error.message });
      throw Error(`Unhandled error! ${error.message}`);
    }
  }

  @Get(':id')
  @HttpCode(200)
  async findPaymentById(@Param() params: { id: string }) {
    try {
      const payment = await this.service.findById(params.id);
      return payment;
    } catch (error) {
      if (error instanceof InvalidId)
        throw new BadRequestException(error.message);
      if (error instanceof PaymentNotFound)
        throw new NotFoundException(error.message);
      throw Error('Unhandled error!');
    }
  }

  @Get('reservation/:reservationId')
  @HttpCode(200)
  async findPaymentByReservationId(@Param() params: { reservationId: string }) {
    try {
      const reservationId = params.reservationId;
      const payment = await this.service.findByReservationId(reservationId);
      return payment;
    } catch (error) {
      if (error instanceof ReservationPaymentNotFound)
        throw new NotFoundException(error.message);
      if (error instanceof InvalidId)
        throw new BadRequestException(error.message);
      throw Error('Unhandled error!');
    }
  }

  @Delete(':id')
  @HttpCode(200)
  async refundPayment(@Param() params: { id: string }, @Req() req: Request) {
    try {
      const user = req.user as { id: number; username: string; role: string };
      const refund = await this.service.refund({ id: params.id, user });
      return refund;
    } catch (error) {
      if (error instanceof InvalidId)
        throw new BadRequestException(error.message);
      if (error instanceof PaymentNotFound)
        throw new NotFoundException(error.message);
      if (error instanceof PaymentCannotBeRefunded)
        throw new ForbiddenException(error.message);
      throw Error('Unhandled error!');
    }
  }

  @Post('/capture')
  @HttpCode(200)
  async capturePayment(
    @Body() data: PaymentCaptureDTO,
    @Req() req: Request,
    @Headers('authorization') token: string,
  ) {
    try {
      const user = req.user as { id: number; username: string; role: string };
      const capture = await this.service.capture({ ...data, user }, token);
      return { capture };
    } catch (error) {
      if (error instanceof zod.ZodError)
        throw new BadRequestException('Invalid data!');
      if (error instanceof AmountZero)
        throw new BadRequestException(error.message);
      if (error instanceof ValueAbovePermitted)
        throw new BadRequestException(error.message);
      if (error instanceof BadRequestException)
        throw new BadRequestException(error.message);
      if (error instanceof PaymentNotFound)
        throw new NotFoundException(error.message);
      if (error instanceof PaymentAutomaticCapture)
        throw new ForbiddenException(error.message);
      if (error instanceof PaymentCannotBeCaptured)
        throw new ForbiddenException(error.message);
      if (error instanceof StripeError) throw new Error(error.message);
      throw Error('Unhandled error!');
    }
  }
}
