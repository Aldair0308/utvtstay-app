import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../interfaces';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
        animationEnabled: true,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Iniciar Sesión',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;