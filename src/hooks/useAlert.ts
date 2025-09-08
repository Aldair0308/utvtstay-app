import { useState } from 'react';
import { ERROR_MESSAGES } from '../const/errors';

interface AlertConfig {
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}


const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });


  const showAlert = (config: AlertConfig) => {
    setAlertState({
      visible: true,
      title: config.title || '',
      message: config.message,
      type: config.type || 'info',
      primaryButton: config.primaryButton,
      secondaryButton: config.secondaryButton,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showError = (message: string, title?: string) => {
    showAlert({
      type: 'error',
      title: title || 'Error',
      message: getUserFriendlyErrorMessage(message),
    });
  };

  const showSuccess = (message: string, title?: string) => {
    showAlert({
      type: 'success',
      title: title || '¡Éxito!',
      message,
    });
  };

  const showWarning = (message: string, title?: string) => {
    showAlert({
      type: 'warning',
      title: title || 'Atención',
      message,
    });
  };

  const showInfo = (message: string, title?: string) => {
    showAlert({
      type: 'info',
      title: title || 'Información',
      message,
    });
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    showAlert({
      type: 'warning',
      title: title || 'Confirmar acción',
      message,
      primaryButton: {
        text: 'Confirmar',
        onPress: () => {
          hideAlert();
          onConfirm();
        },
      },
      secondaryButton: {
        text: 'Cancelar',
        onPress: () => {
          hideAlert();
          onCancel?.();
        },
      },
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showConfirm,
  };
};

const getUserFriendlyErrorMessage = (message: string): string => {
  const errorMappings: { [key: string]: string } = {
    'Network Error': ERROR_MESSAGES.NETWORK_ERROR,
    'Request timeout': ERROR_MESSAGES.REQUEST_TIMEOUT,
    'No autorizado. Por favor, inicia sesión nuevamente.': ERROR_MESSAGES.UNAUTHORIZED,
    'No tienes permisos para realizar esta acción.': ERROR_MESSAGES.FORBIDDEN,
    'Recurso no encontrado.': ERROR_MESSAGES.NOT_FOUND,
    'Error interno del servidor. Intenta más tarde.': ERROR_MESSAGES.INTERNAL_SERVER,
    'Error de conexión. Verifica tu conexión a internet.': ERROR_MESSAGES.CONNECTION_ERROR,
    'Error inesperado. Intenta nuevamente.': ERROR_MESSAGES.UNEXPECTED_ERROR,
    'Credenciales incorrectas': ERROR_MESSAGES.INVALID_CREDENTIALS,
    'Email o contraseña incorrectos': ERROR_MESSAGES.INVALID_CREDENTIALS,
    'Por favor ingresa tu email y contraseña': ERROR_MESSAGES.EMPTY_FIELDS,
    'Por favor ingresa un email válido': ERROR_MESSAGES.INVALID_EMAIL,
    'Este rol no está soportado. Por favor, visita el sitio web': ERROR_MESSAGES.UNSUPPORTED_ROLE,
    'Las credenciales proporcionadas son incorrectas.': ERROR_MESSAGES.INVALID_CREDENTIALS,
  };

  if (errorMappings[message]) {
    return errorMappings[message];
  }

  for (const [key, value] of Object.entries(errorMappings)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  if (message.toLowerCase().includes('error')) {
    return ERROR_MESSAGES.UNEXPECTED_ERROR;
  }

  return message;
};

export default useAlert;