import { map, filter, Subject } from 'rxjs';
import { PaymentEventSSE } from '../dto/PaymentEventSSE';
import { Injectable } from 'node_modules/@nestjs/common';

@Injectable()
export class PaymentSSEService {
  private paymentsEvents$ = new Subject<PaymentEventSSE>();

  notifyPaymentEvents(event: PaymentEventSSE) {
    this.paymentsEvents$.next(event);
  }

  getPaymentsStreamForUser(reservationId: number, userId: number) {
    return this.paymentsEvents$.pipe(
      filter(
        (event) =>
          event.reservationId === reservationId && event.user.id === userId
      ),
      map((event) => ({
        data: JSON.stringify({
          user: event.user,
          reservationId: event.reservationId,
          payment: event.payment,
        }),
      })),
    );
  }
}
