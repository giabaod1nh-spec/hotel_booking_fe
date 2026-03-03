import { api } from './axiosInstance';
import type { AuthRequest, AuthResponse, ApiResponse, LogOutRequest } from '../types/auth';

export const authApi = {
  login: async (credentials: AuthRequest): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (data.result) {
      return data.result;
    }
    throw new Error(data.message || 'Login failed');
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post<ApiResponse<void>>('/auth/logout', { token: refreshToken } as LogOutRequest);
  },
};
