import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeNotificationListeners } from './src/notifications/setup';
import { Platform } from 'react-native';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializeNotificationListeners();
    }
  }, []);
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
