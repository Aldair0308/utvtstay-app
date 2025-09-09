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
      message: message,
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
export default useAlert;