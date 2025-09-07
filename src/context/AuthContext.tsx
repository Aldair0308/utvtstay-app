import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User } from '../interfaces';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * Verificar el estado de autenticación al iniciar la app
   */
  const checkAuthState = async () => {
    try {
      setLoading(true);
      const session = await storageService.getSession();
      
      if (session.token && session.userData && session.isLoggedIn) {
        // Verificar si el token sigue siendo válido
        const isTokenValid = await authService.verifyToken();
        
        if (isTokenValid) {
          setToken(session.token);
          setUser(session.userData);
          setIsLoggedIn(true);
        } else {
          // Token inválido, limpiar sesión
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función de login
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);

      if (response.success && response.data.user.roles.includes('student')) {
        const { user: userData, token: userToken } = response.data;

        // Guardar sesión en AsyncStorage
        await storageService.saveSession(userToken, userData);

        // Actualizar estado
        setToken(userToken);
        setUser(userData);
        setIsLoggedIn(true);

        return true;
      } else if (
        response.success &&
        !response.data.user.roles.includes('student')
      ) {
        throw new Error(
          'Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema.'
        );
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función de logout
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Intentar hacer logout en el servidor
      try {
        await authService.logout();
      } catch (error) {
        console.error('Error during server logout:', error);
        // Continuar con el logout local incluso si falla el servidor
      }
      
      // Limpiar sesión local
      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
      // Asegurar que se limpie la sesión local incluso si hay errores
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar sesión local
   */
  const clearSession = async (): Promise<void> => {
    try {
      await storageService.clearSession();
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  /**
   * Actualizar información del usuario
   */
  const updateUser = async (): Promise<void> => {
    try {
      if (!isLoggedIn) return;
      
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
      await storageService.saveUserData(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      // Si no se puede obtener el usuario, podría ser que el token expiró
      await logout();
    }
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  /**
   * Verificar si el usuario es estudiante
   */
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

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook personalizado para verificar roles
 */
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