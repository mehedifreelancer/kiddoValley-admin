import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError, 
  type InternalAxiosRequestConfig 
} from "axios";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

// Types
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

// Cookie keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Get environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");

// Track if token refresh is in progress
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Process queue
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

// Create axios instance
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Helper to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    
    const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/admin/auth/refresh-token`,
      { refreshToken },
      { withCredentials: true }
    );
    
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      // Update cookies
      Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 7, path: "/" });
      Cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, { expires: 7, path: "/" });
      
      return accessToken;
    }
    
    return null;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

// Request interceptor to add token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 (Unauthorized) and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for login endpoint
      if (originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If refresh is already in progress, queue the request
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
          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          // Process queued requests
          processQueue(null, newToken);
          
          return instance(originalRequest);
        } else {
          // Refresh failed - clear cookies and redirect to login
          Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
          Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
          Cookies.remove("userInfo", { path: "/" });
          
          // Process queue with error
          processQueue(new Error("Refresh token failed"), null);
          
          // Show session expired message
          toast.error("Session expired. Please login again.");
          
          // Redirect to login page
          window.location.href = "/login";
          
          return Promise.reject(new Error("Refresh token failed"));
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other errors
    const errorMessage = (error.response?.data as any)?.message || error.message || "Something went wrong";
    
    // Don't show toast for 401 errors (handled above)
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }
    
    if (import.meta.env.VITE_ENABLE_LOGS === "true") {
      console.error(`❌ API Error: ${originalRequest.url}`, error.response?.data || error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Methods
const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.get<ApiResponse<T>>(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.post<ApiResponse<T>>(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.put<ApiResponse<T>>(url, data, config);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.patch<ApiResponse<T>>(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return instance.delete<ApiResponse<T>>(url, config);
  },
  
  // Upload file with multipart/form-data
  upload: <T = any>(url: string, file: File, fieldName: string = "file", config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
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
  
  // Upload multiple files
  uploadMultiple: <T = any>(url: string, files: File[], fieldName: string = "files", config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
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

export default api;