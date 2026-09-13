import { UserDTO } from 'src/modules/payment/dtos/UserDTO';

// Enums correspondentes
export enum ReservationEventType {
  RESERVATION_CANCELLED = 'reservation.cancelled',
}

export enum Status {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  CHECNKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  NO_SHOW = 'NO_SHOW',
}

export interface ReservationDataMessage {
  id: number;
  user: UserDTO;
}

export interface MessageDataEnvelope<T> {
  eventId: string;
  eventType: ReservationEventType;
  eventVersion: string;
  occurredAt: string;
  source: string;
  correlationId: string;
  data: T;
}

export type ReservationMessageEnvelope =
  MessageDataEnvelope<ReservationDataMessage>;
