import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

// ---------- Types ----------
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ---------- Constants ----------
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Keep trailing slashes as defined in .env
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/admin/";

const API_PUBLIC_BASE_URL =
  import.meta.env.VITE_API_PUBLIC_BASE_URL || "http://localhost:4000/api/public/";

const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");

// ---------- Admin API Instance (with auth) ----------
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// ---------- Refresh token helpers ----------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Path without leading slash – base already ends with "/"
    const response = await instance.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >(
      "auth/refresh-token",
      { refreshToken }
    );

    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 7, path: "/" });
      Cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, {
        expires: 7,
        path: "/",
      });

      return accessToken;
    }

    return null;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

// ---------- Admin request interceptor ----------
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.log(
        `🚀 Admin API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data,
      );
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------- Admin response interceptor ----------
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.log(`✅ Admin API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("auth/sign-in")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();

        if (newToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return instance(originalRequest);
        } else {
          Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
          Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
          Cookies.remove("userInfo", { path: "/" });
          processQueue(new Error("Refresh token failed"), null);
          toast.error("Session expired. Please login again.");
          window.location.href = "/sign-in";
          return Promise.reject(new Error("Refresh token failed"));
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      "Something went wrong";

    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.error(
        `❌ Admin API Error: ${originalRequest.url}`,
        error.response?.data || error.message,
      );
    }

    return Promise.reject(error);
  },
);

// ---------- Public API Instance (no auth, separate base) ----------
const publicInstance: AxiosInstance = axios.create({
  baseURL: API_PUBLIC_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

if (import.meta.env.VITE_ENABLE_LOGS === "true") {
  publicInstance.interceptors.request.use((config) => {
    console.log(`🌐 Public API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    return config;
  });
  publicInstance.interceptors.response.use((response) => {
    console.log(`✅ Public API Response: ${response.config.url}`, response.data);
    return response;
  });
}

// ---------- Exports ----------

// Main admin API (default)
const api = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.get<ApiResponse<T>>(url, config);
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.post<ApiResponse<T>>(url, data, config);
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.put<ApiResponse<T>>(url, data, config);
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.patch<ApiResponse<T>>(url, data, config);
  },

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.delete<ApiResponse<T>>(url, config);
  },

  upload: <T = any>(
    url: string,
    file: File,
    fieldName: string = "file",
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },

  uploadMultiple: <T = any>(
    url: string,
    files: File[],
    fieldName: string = "files",
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });
    return instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Public API (named export)
export const apiPublic = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return publicInstance.get<ApiResponse<T>>(url, config);
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return publicInstance.post<ApiResponse<T>>(url, data, config);
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return publicInstance.put<ApiResponse<T>>(url, data, config);
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return publicInstance.patch<ApiResponse<T>>(url, data, config);
  },

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return publicInstance.delete<ApiResponse<T>>(url, config);
  },
};

export default api;