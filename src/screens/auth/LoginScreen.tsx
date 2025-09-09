import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';
import CustomAlert from '../../components/common/CustomAlert';
import useAlert from '../../hooks/useAlert';
import { ERROR_MESSAGES } from '../../const/errors';
import { MaterialIcons } from '@expo/vector-icons';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const { alertState, hideAlert, showError } = useAlert();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError(ERROR_MESSAGES.EMPTY_FIELDS);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }
    try {
      const result = await login(email, password);
      if (!result.success && result.error) {
        showError(ERROR_MESSAGES.UNSUPPORTED_ROLE);
        console.log(ERROR_MESSAGES.UNSUPPORTED_ROLE);
        return;
    }
    } catch (error) {
      showError(ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
  };

  if (loading) {
    return <LoadingScreen message="Iniciando sesión..." />;
  }

  const TogglePasswordInput = () => {
    setPasswordVisible(!passwordVisible);
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../../../assets/img/logo_vacio.png')}
              style={{ width: 120, height: 120, resizeMode: 'contain' }}
              accessibilityLabel="Logo vacío"
            />
          </View>
          <Text style={styles.subtitle}>
            Sistema de Gestión de Archivos
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.description}>
            Ingresa tus credenciales de estudiante
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@example.com"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={TogglePasswordInput}
              >
                <MaterialIcons
                  name={passwordVisible ? 'visibility' : 'visibility-off'}
                  size={24}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Solo estudiantes pueden acceder al sistema
            </Text>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        primaryButton={alertState.primaryButton}
        secondaryButton={alertState.secondaryButton}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.screenPadding,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: theme.dimensions.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    ...theme.typography.styles.h2,
    color: theme.colors.textLight,
    fontWeight: 'bold',
  },
  subtitle: {
    ...theme.typography.styles.bodySmall,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.dimensions.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  title: {
    ...theme.typography.styles.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.styles.bodySmall,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.styles.label,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
  },
  loginButton: {
    ...theme.components.button.primary,
    marginTop: theme.spacing.md,
  },
  loginButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.textLight,
  },
  infoContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.dimensions.borderRadius.md,
  },
  infoText: {
    ...theme.typography.styles.caption,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    ...theme.components.input,
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  passwordToggleText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
  },
});

export default LoginScreen;