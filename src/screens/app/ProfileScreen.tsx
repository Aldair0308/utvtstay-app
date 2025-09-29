import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import { theme } from '../../theme';
import CustomAlert from '../../components/common/CustomAlert';
import useAlert from '../../hooks/useAlert';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      showSuccess('Tu contraseña ha sido actualizada correctamente');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      showError('No se pudo cambiar la contraseña. Verifica que tu contraseña actual sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      '¿Estás seguro que deseas cerrar sesión?',
      logout,
      undefined,
      'Cerrar Sesión'
    );
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'student':
        return 'Estudiante';
      case 'teacher':
        return 'Profesor';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleText}>{formatRole(user?.roles?.[0] || 'student')}</Text>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre Completo:</Text>
          <Text style={styles.infoValue}>{user?.name || 'No disponible'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email || 'No disponible'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rol:</Text>
          <Text style={styles.infoValue}>{formatRole(user?.roles?.[0] || 'student')}</Text>
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración de Cuenta</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowChangePassword(true)}
        >
          <Text style={styles.settingIcon}>🔒</Text>
          <Text style={styles.settingText}>Cambiar Contraseña</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la App</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>ℹ️</Text>
          <Text style={styles.settingText}>Acerca de UTVstay</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>📋</Text>
          <Text style={styles.settingText}>Términos y Condiciones</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔒</Text>
          <Text style={styles.settingText}>Política de Privacidad</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePassword(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={loading}>
              <Text style={[
                styles.modalSaveText,
                loading && styles.modalSaveTextDisabled
              ]}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña Actual</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>
              <Text style={styles.requirementText}>• Mínimo 6 caracteres</Text>
              <Text style={styles.requirementText}>• Se recomienda usar mayúsculas, minúsculas y números</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        primaryButton={alertState.primaryButton}
        secondaryButton={alertState.secondaryButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.styles.h2,
    color: theme.colors.textLight,
    fontWeight: 'bold',
  },
  userName: {
    ...theme.typography.styles.h2,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.dimensions.borderRadius.full,
  },
  roleText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  section: {
    margin: theme.spacing.screenPadding,
    ...theme.components.card,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary, // Agregado para probar hot reload
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.styles.body,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    width: 24,
  },
  settingText: {
    ...theme.typography.styles.body,
    flex: 1,
  },
  settingChevron: {
    ...theme.typography.styles.h4,
    color: theme.colors.textTertiary,
  },
  logoutSection: {
    margin: theme.spacing.screenPadding,
    marginBottom: theme.spacing.lg,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.dimensions.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...theme.typography.styles.button,
    color: theme.colors.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  modalCancelText: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    ...theme.typography.styles.h4,
  },
  modalSaveText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: theme.colors.textTertiary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.screenPadding,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.styles.label,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
  },
  passwordRequirements: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.dimensions.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  requirementsTitle: {
    ...theme.typography.styles.bodySmall,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  requirementText: {
    ...theme.typography.styles.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});

export default ProfileScreen;