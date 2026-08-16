export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "data_accountant" | "moderator";
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}
