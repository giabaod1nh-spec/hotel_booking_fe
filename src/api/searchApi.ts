import { api } from './axiosInstance';
import type { ApiResponse, HotelSearchResponse, PageResponse } from '../types/api';

export interface HotelSearchPageRequest {
  city: string;
  checkIn: string;       // yyyy-MM-dd
  checkOut: string;      // yyyy-MM-dd
  totalGuest: number;
  totalRoom: number;
  starRating?: number[];
  amenityIds?: string[];
  page?: number;
  size?: number;
  /** "price" | "score" | "review" | "starRating" | "createdAt" */
  sortBy?: string;
  /** "asc" | "desc" */
  direction?: string;
}

const EMPTY_PAGE: PageResponse<HotelSearchResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 10,
  hasNext: false,
};

export const searchApi = {
  searchHotels: async (
    req: HotelSearchPageRequest,
  ): Promise<PageResponse<HotelSearchResponse>> => {
    const res = await api.post<ApiResponse<PageResponse<HotelSearchResponse>>>(
      '/search/second',
      req,
    );
    return res.data.result ?? EMPTY_PAGE;
  },
};
