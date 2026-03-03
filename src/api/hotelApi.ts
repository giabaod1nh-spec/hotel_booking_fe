import { api } from './axiosInstance';
import type { ApiResponse, HotelResponse } from '../types/api';

export interface HotelSearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
  city?: string;
  country?: string;
  starRating?: number;
}

export const hotelApi = {
  getHotels: async (params?: HotelSearchParams): Promise<HotelResponse[]> => {
    const res = await api.get<ApiResponse<HotelResponse[]>>('/hotel/sortHotel', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sortBy: params?.sortBy ?? 'createdAt',
        direction: params?.direction ?? 'desc',
        ...(params?.city ? { city: params.city } : {}),
        ...(params?.country ? { country: params.country } : {}),
        ...(params?.starRating ? { starRating: params.starRating } : {}),
      },
    });
    return res.data.result ?? [];
  },

  getHotelById: async (hotelId: string): Promise<HotelResponse> => {
    const res = await api.get<ApiResponse<HotelResponse>>(`/hotel/get/${hotelId}`);
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Hotel not found');
  },
};
