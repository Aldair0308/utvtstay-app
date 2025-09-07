import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert(
          'Error de autenticación',
          'Credenciales incorrectas o no tienes permisos de estudiante'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al iniciar sesión. Por favor intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Iniciando sesión..." />;
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
            <Text style={styles.logoText}>UTVstay</Text>
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
              placeholder="tu.email@utvt.edu.mx"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
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
    backgroundColor: theme.colors.primary,
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
});

export default LoginScreen;