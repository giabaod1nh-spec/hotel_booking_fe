import { api } from './axiosInstance';
import type { ApiResponse, RoomResponse } from '../types/api';

export const roomApi = {
  getAvailableByRoomType: async (roomTypeId: string): Promise<RoomResponse[]> => {
    const res = await api.get<ApiResponse<RoomResponse[]>>('/room/getPagination', {
      params: { roomTypeId, page: 0, size: 100 },
    });
    return res.data.result ?? [];
  },
};
