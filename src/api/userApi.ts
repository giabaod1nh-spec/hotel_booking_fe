import { api } from './axiosInstance';
import type { ApiResponse, UserResponse } from '../types/api';

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface ChangePassRequest {
  userId: string;
  password: string;
  confirmPassword: string;
}

export const userApi = {
  register: async (data: RegisterRequest): Promise<UserResponse> => {
    const res = await api.post<ApiResponse<UserResponse>>('/user/register', data);
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Registration failed');
  },

  getMe: async (): Promise<UserResponse> => {
    const res = await api.get<ApiResponse<UserResponse>>('/user/me');
    if (res.data.result) return res.data.result;
    throw new Error(res.data.message || 'Failed to get user');
  },

  changePassword: async (data: ChangePassRequest): Promise<void> => {
    await api.put('/user/changePass', data);
  },
};
