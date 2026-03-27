import { useState, useEffect, useCallback } from "react";
import type { User } from "../context/GlobalContext";
import { authService } from "../modules/auth/auth.service";

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user from cookie on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = authService.getUserInfo();
      const hasToken = authService.isAuthenticated();
      
      if (storedUser && hasToken) {
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  // Login function
  const login = useCallback(async (credentials: { usernameOrEmail: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user info
  const refreshUser = useCallback(() => {
    const storedUser = authService.getUserInfo();
    setUser(storedUser);
    setIsAuthenticated(!!storedUser && authService.isAuthenticated());
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };
};