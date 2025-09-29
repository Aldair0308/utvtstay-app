import useAlert from '../../hooks/useAlert';

export const useProfileAlerts = (onLogoutConfirm: () => void) => {
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();

  const handleLogout = () => {
    showConfirm(
      '¿Estás seguro que deseas cerrar sesión?',
      onLogoutConfirm,
      undefined,
      'Cerrar Sesión'
    );
  };

  const showPasswordChangeError = (message: string) => {
    showError(message);
  };

  const showPasswordChangeSuccess = () => {
    showSuccess('Tu contraseña ha sido actualizada correctamente');
  };

  const showPasswordChangeValidationError = (message: string) => {
    showError(message);
  };

  return {
    alertState,
    hideAlert,
    handleLogout,
    showPasswordChangeError,
    showPasswordChangeSuccess,
    showPasswordChangeValidationError,
  };
};