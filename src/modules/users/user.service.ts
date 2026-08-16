import api from "../../apiConfig";
import {
  CreateUserPayload,
  PaginatedResponse,
  UpdateUserPayload,
  User,
} from "./user.types";

export const getUsers = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<User>> => {
  const res = await api.get<PaginatedResponse<User>>("/users", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const res = await api.post<{ success: boolean; data: User }>(
    "/users",
    payload,
  );
  return res.data.data;
};

export const updateUser = async (
  id: number,
  payload: UpdateUserPayload,
): Promise<User> => {
  const res = await api.put<{ success: boolean; data: User }>(
    `/users/${id}`,
    payload,
  );
  return res.data.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};
