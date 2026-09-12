import axios from 'axios';

const aplicationHotelApi = axios.create({
  baseURL: process.env.HOTEL_API_URL,
  timeout: 5000,
});

export const getClientData = async (id: number, token: string) => {
  const response = await aplicationHotelApi.get(`/client/user/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
