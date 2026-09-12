import { Currency } from '../domain/enums/Currency';
import { Method } from '../domain/enums/Method';

export interface CreatePaymentIntent {
  reservationId: number;
  userId: number;
  amount: number;
  method: Method;
  currency?: Currency;
}
