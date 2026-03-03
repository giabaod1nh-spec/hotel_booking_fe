import { api } from './axiosInstance';
import type { ApiResponse, BookingResponse } from '../types/api';

export const bookingApi = {
  getMyBookings: async (): Promise<BookingResponse[]> => {
    const res = await api.get<ApiResponse<BookingResponse[]>>('/booking/getBookingHistory');
    return res.data.result ?? [];
  },

  getBookingById: async (bookingId: string): Promise<BookingResponse> => {
    const res = await api.get<ApiResponse<BookingResponse>>(`/booking/get/${bookingId}`);
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Booking not found');
  },

  getByBookingCode: async (bookingCode: string): Promise<BookingResponse> => {
    const res = await api.get<ApiResponse<BookingResponse>>(`/booking/code/${bookingCode}`);
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Booking not found');
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await api.put(`/booking/cancel/${bookingId}`);
  },

  getReviewableBookings: async (): Promise<BookingResponse[]> => {
    const res = await api.get<ApiResponse<BookingResponse[]>>('/booking/reviewable');
    return res.data.result ?? [];
  },

  checkIn: async (bookingId: string, rooms: { bookingRoomId: string; roomId: string }[]): Promise<void> => {
    await api.request({
      method: 'PUT',
      url: `/booking/checkIn/${bookingId}`,
      data: { rooms },
    });
  },

  checkOut: async (bookingId: string): Promise<void> => {
    await api.request({
      method: 'PUT',
      url: `/booking/checkOut/${bookingId}`,
    });
  },
};
