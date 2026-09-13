import { IPaymentRepository } from './IPaymentRepository';
import { prisma } from '../../../lib/prisma';
import { Payment, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { UpdatePaymentDTO } from '../dtos/UpdatePaymentDTO';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  async create(data: Prisma.PaymentCreateInput) {
    const payment = await prisma.payment.create({ data });
    return payment;
  }

  async findReservationPayments(reservationId: number) {
    const payments = await prisma.payment.findMany({
      where: {
        reservationId,
        status: {
          in: ['CREATED', 'AUTHORIZED', 'REQUIRES_ACTION'],
        },
      },
    });
    return payments;
  }

  async findPaymentById(id: number) {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
      },
    });
    return payment;
  }

  async findPaymentByStripePaymentIntentId(stripePaymentIntentId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId,
      },
    });
    return payment;
  }

  async update(id: number, data: UpdatePaymentDTO): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amountCaptured: data.amountCaptured ? data.amountCaptured : undefined,
        status: data.status ? data.status : undefined,
      },
    });
    return payment;
  }
}
