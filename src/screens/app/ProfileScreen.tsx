import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import { theme } from '../../theme';
import CustomAlert from '../../components/common/CustomAlert';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useProfileAlerts } from '../../components/common/ProfileAlerts';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../interfaces';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList, 'Profile'>>();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {
    alertState,
    hideAlert,
    handleLogout,
    showPasswordChangeError,
    showPasswordChangeSuccess,
    showPasswordChangeValidationError,
  } = useProfileAlerts(logout);

  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showPasswordChangeValidationError('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      showPasswordChangeValidationError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      showPasswordChangeValidationError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      showPasswordChangeSuccess();
      setShowChangePassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      showPasswordChangeError('No se pudo cambiar la contraseña. Verifica que tu contraseña actual sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPress = () => {
    handleLogout();
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
          <Image 
            source={require('../../../assets/img/logo_vacio.png')}
            style={styles.avatarImage}
            resizeMode="contain"
          />
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
        
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('About')}>
          <Text style={styles.settingIcon}>ℹ️</Text>
          <Text style={styles.settingText}>Acerca de UTVstay</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.settingIcon}>📋</Text>
          <Text style={styles.settingText}>Términos y Condiciones</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.settingIcon}>🔒</Text>
          <Text style={styles.settingText}>Política de Privacidad</Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onChangePassword={handleChangePassword}
        loading={loading}
      />
      
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
    backgroundColor: theme.colors.whiteBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarImage: {
    width: 60,
    height: 60,
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
});

export default ProfileScreen;