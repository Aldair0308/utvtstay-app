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
import { theme } from '../../theme';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onChangePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onChangePassword,
  loading = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async () => {
    await onChangePassword(currentPassword, newPassword, confirmPassword);
  };

  const handleClose = () => {
    // Limpiar campos al cerrar
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
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
  );
};

const styles = StyleSheet.create({
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

export default ChangePasswordModal;