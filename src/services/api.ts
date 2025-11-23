import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERROR_MESSAGES } from "../const/errors";

// Cambiar por la URL real de tu API
// const API_BASE_URL = "https://estadias-production.up.railway.app/api";
const API_BASE_URL = "http://192.168.100.142:8000/api";

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
      console.log("[API] Request to:", config.url);
      console.log(
        "[API] Token found:",
        token ? `${token.substring(0, 20)}...` : "No token"
      );

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "[API] Authorization header set:",
          `Bearer ${token.substring(0, 20)}...`
        );
      } else {
        console.warn(
          "[API] No token found in storage for request to:",
          config.url
        );
      }
    } catch (error) {
      console.error("[API] Error getting token from storage:", error);
      showError(ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
    return config;
  },
  (error) => {
    console.error("[API] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Variable para evitar múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor de respuestas: degradar el 500 de editor-content (Excel) a WARN
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      "[API] Response from:",
      response.config.url,
      "Status:",
      response.status
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = error.config?.url;

    // Detecta el caso esperado: editor-content fallando porque el archivo no es Word
    const isNonWordEditorContent =
      status === 500 &&
      url?.includes("/editor-content") &&
      (String(error.response?.data?.message || "")
        .toLowerCase()
        .includes("not a word document") ||
        String(error.response?.data?.error || "")
          .toLowerCase()
          .includes("failed to get editor content"));

    // Silenciar el caso esperado (editor-content no Word) para no ensuciar consola
    if (!isNonWordEditorContent) {
      console.error("[API] Response error:", {
        url,
        status,
        message: error.message,
        data: error.response?.data,
        isRetry: originalRequest._retry,
      });
    }

    if (status === 401 && !originalRequest._retry) {
      console.warn("[API] 401 Unauthorized - Attempting token refresh");

      if (isRefreshing) {
        console.log("[API] Token refresh already in progress, queuing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar obtener un nuevo token (esto depende de tu implementación)
        // Por ahora, simplemente limpiamos la sesión
        console.log("[API] Clearing session due to 401 error");
        await AsyncStorage.multiRemove(["userToken", "userData", "isLoggedIn"]);

        processQueue(error, null);

        // Aquí podrías disparar un evento para redirigir al login
        // o usar un navigation service

        return Promise.reject(error);
      } catch (refreshError) {
        console.error("[API] Error during token refresh:", refreshError);
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(["userToken", "userData", "isLoggedIn"]);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (status === 403) {
      console.warn("[API] 403 Forbidden - Insufficient permissions for:", url);
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
};
