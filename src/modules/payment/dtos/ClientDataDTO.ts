export interface ClientDataDTO {
  id: number;
  userId: number;
  dateOfBirth: string;
  email: string;
  name: string;
  pin: string;
  contactInformation: {
    phoneNumber: string;
    street: string;
    neighborhood: string;
    number?: string;
    city: string;
    state: string;
    complement?: string;
    postalCode: string;
  };
}
