export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  authenticated: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

export interface LogOutRequest {
  token: string;
}
