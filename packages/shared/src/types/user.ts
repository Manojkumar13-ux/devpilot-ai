export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiError {
  error: string;
  message: string;
}
