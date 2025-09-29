import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { theme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose: () => void;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  primaryButton,
  secondaryButton,
}) => {
  const getAlertColor = () => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <MaterialIcons name="close" size={30} color="white" />;
      case 'success':
        return <MaterialIcons name="check" size={30} color="white" />;
      case 'warning':
        return <MaterialIcons name="warning" size={30} color="white" />;
      case 'info':
      default:
        return <MaterialIcons name="info" size={30} color="white" />;
    }
  };

  const getUserFriendlyTitle = () => {
    switch (type) {
      case 'error':
        return title || 'Algo salió mal';
      case 'success':
        return title || '¡Perfecto!';
      case 'warning':
        return title || 'Atención';
      case 'info':
      default:
        return title || 'Información';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.iconContainer, { backgroundColor: getAlertColor() }]}>
            <Text style={styles.icon}>{getIcon()}</Text>
          </View>
          
          <Text style={styles.title}>{getUserFriendlyTitle()}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            {secondaryButton && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={secondaryButton.onPress}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: getAlertColor() }]}
              onPress={primaryButton?.onPress || onClose}
            >
              <Text style={styles.primaryButtonText}>
                {primaryButton?.text || 'Entendido'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  alertContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.dimensions.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    ...theme.shadows.large,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    ...theme.typography.styles.h3,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  message: {
    ...theme.typography.styles.body,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.dimensions.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.textLight,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  secondaryButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default CustomAlert;