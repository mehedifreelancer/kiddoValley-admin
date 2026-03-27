export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      avatar?: string;
    };
  };
  message?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}