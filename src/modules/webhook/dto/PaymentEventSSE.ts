import { PaymentDetails } from 'src/modules/payment/dtos/PaymentDetails';
import { UserDTO } from 'src/modules/payment/dtos/UserDTO';

export interface PaymentEventSSE {
  user: UserDTO;
  reservationId: number;
  payment: PaymentDetails;
}
