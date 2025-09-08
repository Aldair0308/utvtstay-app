import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERROR_MESSAGES } from '../const/errors';

// Cambiar por la URL real de tu API
const API_BASE_URL = "https://estadias-production.up.railway.app/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

const showError = (message: string) => {
    alert(message);
  };
// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token from storage:", error);
      showError(ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      try {
        await AsyncStorage.multiRemove(["userToken", "userData", "isLoggedIn"]);
        // Aquí podrías disparar un evento para redirigir al login
        // o usar un navigation service
      } catch (storageError) {
        console.error("Error clearing storage:", storageError);
        showError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Función helper para manejar errores de API
export const handleApiError = (error: any): string => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 422 && data.errors) {
      const firstError = Object.values(data.errors)[0] as string[];
      return firstError[0] || ERROR_MESSAGES.VALIDATION_ERROR;
    }
    if (data.message) {
      return data.message;
    }
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.INTERNAL_SERVER;
      default:
        return `Error del servidor (${status})`;
    }
  } else if (error.request) {
    return ERROR_MESSAGES.CONNECTION_ERROR;
  } else {
    return ERROR_MESSAGES.UNEXPECTED_ERROR;
  }
}
