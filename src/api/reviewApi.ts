import { api } from './axiosInstance';
import type { ApiResponse, ReviewResponse } from '../types/api';

export interface CreateReviewPayload {
  hotelId: string;
  bookingId: string;
  reviewRating: number;
  reviewPositiveComment?: string;
  reviewNegativeComment?: string;
}

export const reviewApi = {
  getByHotel: async (hotelId: string): Promise<ReviewResponse[]> => {
    const res = await api.get<ApiResponse<ReviewResponse[]>>(`/reviews/hotel/${hotelId}`);
    return res.data.result ?? [];
  },

  create: async (payload: CreateReviewPayload, files?: File[]): Promise<ReviewResponse> => {
    const formData = new FormData();

    const reviewBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('review', reviewBlob);

    if (files && files.length > 0) {
      files.forEach((f) => formData.append('files', f));
    }

    const res = await api.post<ApiResponse<ReviewResponse>>('/reviews/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Failed to submit review');
  },
};
