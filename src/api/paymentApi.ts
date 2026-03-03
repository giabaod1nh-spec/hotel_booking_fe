import { api } from './axiosInstance';
import type { ApiResponse } from '../types/api';

export const paymentApi = {
  createPayment: async (bookingId: string): Promise<string> => {
    const res = await api.post<ApiResponse<{ paymentUrl?: string }>>(
      `/payments/create/${bookingId}`
    );
    const url = res.data.result?.paymentUrl;
    if (!url) throw new Error(res.data.message || 'Failed to create payment');
    return url;
  },
};
