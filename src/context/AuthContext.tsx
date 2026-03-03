import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api/authApi';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const response = await authApi.login({ username, password });
      if (response.authenticated && response.accessToken && response.refreshToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const apiError = apiErr?.response?.data?.message;
      setError(apiError || (err instanceof Error ? err.message : 'Login failed'));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refresh) {
        await authApi.logout(refresh);
      }
    } catch {
      // Still clear local state even if API fails
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
