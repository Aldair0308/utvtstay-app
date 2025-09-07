import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import LoadingScreen from '../components/common/LoadingScreen';

const RootNavigator: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();

  // Mostrar pantalla de carga mientras se verifica el estado de autenticación
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;