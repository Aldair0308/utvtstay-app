import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Cargando...' 
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
        style={styles.spinner}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingScreen;