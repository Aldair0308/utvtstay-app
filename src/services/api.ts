import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cambiar por la URL real de tu API
const API_BASE_URL = "https://estadias-production.up.railway.app/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 segundos de timeout
});

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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
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
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Función helper para manejar errores de API
export const handleApiError = (error: any): string => {
  if (error.response) {
    // El servidor respondió con un código de error
    const { status, data } = error.response;

    if (status === 422 && data.errors) {
      // Errores de validación
      const firstError = Object.values(data.errors)[0] as string[];
      return firstError[0] || "Error de validación";
    }

    if (data.message) {
      return data.message;
    }

    switch (status) {
      case 401:
        return "No autorizado. Por favor, inicia sesión nuevamente.";
      case 403:
        return "No tienes permisos para realizar esta acción.";
      case 404:
        return "Recurso no encontrado.";
      case 500:
        return "Error interno del servidor. Intenta más tarde.";
      default:
        return `Error del servidor (${status})`;
    }
  } else if (error.request) {
    // La petición se hizo pero no hubo respuesta
    return "Error de conexión. Verifica tu conexión a internet.";
  } else {
    // Error en la configuración de la petición
    return "Error inesperado. Intenta nuevamente.";
  }
};
