import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../interfaces';
import { ERROR_MESSAGES } from '../const/errors';

// Claves para AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  IS_LOGGED_IN: 'isLoggedIn',
  THEME_PREFERENCE: 'themePreference',
  LANGUAGE_PREFERENCE: 'languagePreference',
  NOTIFICATION_SETTINGS: 'notificationSettings',
} as const;

export const storageService = {
  /**
   * Guardar token de usuario
   */
  saveUserToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error saving user token:', error);
      throw new Error('Error al guardar el token de usuario');
    }
  },

  /**
   * Obtener token de usuario
   */
  getUserToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  },

  /**
   * Guardar datos del usuario
   */
  saveUserData: async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Error al guardar los datos del usuario');
    }
  },

  /**
   * Obtener datos del usuario
   */
  getUserData: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Guardar estado de login
   */
  saveLoginState: async (isLoggedIn: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, isLoggedIn.toString());
    } catch (error) {
      console.error('Error saving login state:', error);
      throw new Error('Error al guardar el estado de login');
    }
  },

  /**
   * Obtener estado de login
   */
  getLoginState: async (): Promise<boolean> => {
    try {
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      return isLoggedIn === 'true';
    } catch (error) {
      console.error('Error getting login state:', error);
      return false;
    }
  },

  /**
   * Guardar sesión completa (token, userData, loginState)
   */
  saveSession: async (token: string, userData: User): Promise<void> => {
    try {
      await Promise.all([
        storageService.saveUserToken(token),
        storageService.saveUserData(userData),
        storageService.saveLoginState(true),
      ]);
    } catch (error) {
      console.error('Error saving session:', error);
      throw new Error('Error al guardar la sesión');
    }
  },

  /**
   * Obtener sesión completa
   */
  getSession: async (): Promise<{
    token: string | null;
    userData: User | null;
    isLoggedIn: boolean;
  }> => {
    try {
      const [token, userData, isLoggedIn] = await Promise.all([
        storageService.getUserToken(),
        storageService.getUserData(),
        storageService.getLoginState(),
      ]);

      return { token, userData, isLoggedIn };
    } catch (error) {
      console.error('Error getting session:', error);
      return { token: null, userData: null, isLoggedIn: false };
    }
  },

  /**
   * Limpiar sesión completa
   */
  clearSession: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.IS_LOGGED_IN,
      ]);
    } catch (error) {
      console.error('Error clearing session:', error);
      throw new Error('Error al limpiar la sesión');
    }
  },

  /**
   * Guardar preferencia de tema
   */
  saveThemePreference: async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  },

  /**
   * Obtener preferencia de tema
   */
  getThemePreference: async (): Promise<'light' | 'dark' | 'system'> => {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      return (theme as 'light' | 'dark' | 'system') || 'system';
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return 'system';
    }
  },

  /**
   * Guardar configuración de notificaciones
   */
  saveNotificationSettings: async (settings: {
    enabled: boolean;
    deadlines: boolean;
    meetings: boolean;
    reviews: boolean;
  }): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  },

  /**
   * Obtener configuración de notificaciones
   */
  getNotificationSettings: async (): Promise<{
    enabled: boolean;
    deadlines: boolean;
    meetings: boolean;
    reviews: boolean;
  }> => {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return settings
        ? JSON.parse(settings)
        : { enabled: true, deadlines: true, meetings: true, reviews: true };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return { enabled: true, deadlines: true, meetings: true, reviews: true };
    }
  },

  /**
   * Limpiar todos los datos de almacenamiento
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw new Error(ERROR_MESSAGES.STORAGE_CLEAR_ERROR);
    }
  },
};

export { STORAGE_KEYS };