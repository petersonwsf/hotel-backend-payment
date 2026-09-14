import { map, filter, Subject, Observable } from 'rxjs';
import { PaymentEventSSE } from '../dto/PaymentEventSSE';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentSSEService {
  private paymentsEvents$ = new Subject<PaymentEventSSE>();

  notifyPaymentEvents(event: PaymentEventSSE) {
    this.paymentsEvents$.next(event);
  }

  getPaymentsStreamForUser(
    reservationId: number,
    userId: number,
  ): Observable<MessageEvent> {
    return this.paymentsEvents$.pipe(
      filter(
        (event) =>
          event.reservationId === reservationId && event.userId === userId,
      ),
      map(
        (event) =>
          ({
            data: {
              userId: event.userId,
              reservationId: event.reservationId,
              payment: event.payment,
            },
          }) as MessageEvent,
      ),
    );
  }
}
