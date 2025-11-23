import apiClient, { handleApiError } from './api';
import { LoginResponse, User, ApiResponse } from '../interfaces';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },


  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/user');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('No se pudo obtener la información del usuario');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Verificar si el token es válido
   */
  verifyToken: async (): Promise<boolean> => {
    try {
      await apiClient.get('/user');
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    try {
      const response = await apiClient.put<ApiResponse>('/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
