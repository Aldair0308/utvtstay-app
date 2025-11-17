import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User } from '../interfaces';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { ERROR_MESSAGES } from '../const/errors';
import useDeviceRegistration from '../hooks/useDeviceRegistration';
import { ensureNotificationPermissions } from '../notifications/setup';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { registerDevice } = useDeviceRegistration();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      const session = await storageService.getSession();

      if (session.token && session.userData && session.isLoggedIn) {
        const isTokenValid = await authService.verifyToken();

        if (isTokenValid) {
          setToken(session.token);
          setUser(session.userData);
          setIsLoggedIn(true);
        } else {
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      if (response.success && response.data.user.roles.includes('student')) {
        const { user: userData, token: userToken } = response.data;
        await storageService.saveSession(userToken, userData);
        setToken(userToken);
        setUser(userData);
        setIsLoggedIn(true);
        try {
          await ensureNotificationPermissions();
          await registerDevice();
        } catch {}
        return { success: true };
      } else if (
        response.success &&
        !response.data.user.roles.includes('student')
      ) {
        return { success: false, error: ERROR_MESSAGES.UNSUPPORTED_ROLE };
      }
      return { success: false, error: ERROR_MESSAGES.INVALID_CREDENTIALS };
    } catch (error) {
      return { success: false, error: ERROR_MESSAGES.UNEXPECTED_ERROR };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }

      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async (): Promise<void> => {
    try {
      await storageService.clearSession();
    } catch (error) {
      console.error('Clear session error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateUser = async (): Promise<void> => {
    try {
      if (!isLoggedIn) return;

      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
      await storageService.saveUserData(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      await logout();
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const isStudent = (): boolean => {
    return hasRole('student');
  };

  const contextValue: AuthContextType = {
    isLoggedIn,
    user,
    token,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthRole = () => {
  const { user } = useAuth();

  return {
    hasRole: (role: string) => user?.roles.includes(role) || false,
    isStudent: () => user?.roles.includes('student') || false,
    isAdmin: () => user?.roles.includes('admin') || false,
    isTutor: () => user?.roles.includes('tutor') || false,
  };
};

export default AuthContext;