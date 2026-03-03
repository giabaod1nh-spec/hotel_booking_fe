export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

/* ---- Pagination wrapper (matches backend PageResponse<T>) ---- */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
}

/* ---- Search response types (POST /search/second) ---- */
export interface AmenityResponse {
  amenityId: string;
  amenityName?: string;
  amenityIcon?: string;
}

export interface HotelImageResponse {
  hotelImageId?: string;
  hotelImageUrl?: string;
  isPrimary?: boolean;
}

export interface RoomTypeSearchItem {
  roomTypeId?: string;
  roomTypeName?: string;
  roomTypeDesc?: string;
  maxOccupy?: number;
  totalPrice?: number;
  primaryImageUrl?: string;
}

export interface HotelSearchResponse {
  hotelId: string;
  hotelName?: string;
  hotelCity?: string;
  hotelCountry?: string;
  hotelAddress?: string;
  hotelDesc?: string;
  starRating?: number;
  hotelStatus?: string;
  lowestPrice?: number;
  primaryImageUrl?: string;
  recommendRoomType?: string;
  bedSummary?: string;
  totalGuest?: number;
  totalNight?: number;
  totalReview?: number;
  adjustedScore?: number;
  amenities?: AmenityResponse[];
  hotelImages?: HotelImageResponse[];
  roomTypeSearchItems?: RoomTypeSearchItem[];
  reviewCount?: number;
}

export interface RoleResponse {
  roleName: string;
  description?: string;
}

export interface UserResponse {
  userId: string;
  email?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  roles?: RoleResponse[];
}

export interface HotelResponse {
  hotelId: string;
  hotelName?: string;
  hotelDescription?: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelCountry?: string;
  hotelPhone?: string;
  hotelEmail?: string;
  starRating?: number;
  hotelStatus?: string;
  avgRating?: number;
  totalReviews?: number;
}

export interface RoomTypeResponse {
  roomTypeId: string;
  roomTypeName?: string;
  roomTypeDesc?: string;
  basePrice?: number;
  maxOccupy?: number;
  totalRooms?: number;
}

export interface ReviewImageResponse {
  reviewImageId?: string;
  reviewImageUrl?: string;
}

export interface ReviewResponse {
  reviewId?: string;
  reviewRating?: number;
  reviewPositiveComment?: string;
  reviewNegativeComment?: string;
  userName?: string;
  createdAt?: string;
  reviewImagesList?: ReviewImageResponse[];
}

export interface BookingRoomItemResponse {
  bookingRoomId?: string;
  roomTypeId?: string;
  roomTypeName?: string;
  quantity?: number;
  pricePerNight?: number;
  subTotal?: number;
}

export interface RoomResponse {
  roomId?: string;
  roomNumber?: string;
  roomStatus?: string;
}

export interface BookingResponse {
  bookingId?: string;
  hotelId?: string;
  bookingCode?: string;
  hotelName?: string;
  roomTypeName?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  numGuest?: number;
  specialRequest?: string;
  status?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalRooms?: number;
  totalPrice?: number;
  bookingRoomItemResponses?: BookingRoomItemResponse[];
}
