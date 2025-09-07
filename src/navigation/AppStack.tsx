import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from '../interfaces';

// Importar pantallas (se crearán después)
import DashboardScreen from '../screens/app/DashboardScreen';
import FilesScreen from '../screens/app/FilesScreen';
import FileDetailScreen from '../screens/app/FileDetailScreen';
import FileHistoryScreen from '../screens/app/FileHistoryScreen';
import FileEditScreen from '../screens/app/FileEditScreen';
import CalendarScreen from '../screens/app/CalendarScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

const Stack = createStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#10B981',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: { backgroundColor: '#F9FAFB' },
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'UTVstay',
          headerLeft: () => null, // No mostrar botón de regreso en dashboard
        }}
      />
      
      <Stack.Screen 
        name="Files" 
        component={FilesScreen}
        options={{
          title: 'Mis Archivos',
        }}
      />
      
      <Stack.Screen 
        name="FileDetail" 
        component={FileDetailScreen}
        options={{
          title: 'Detalle del Archivo',
        }}
      />
      
      <Stack.Screen 
        name="FileHistory" 
        component={FileHistoryScreen}
        options={{
          title: 'Historial de Versiones',
        }}
      />
      
      <Stack.Screen 
        name="FileEdit" 
        component={FileEditScreen}
        options={{
          title: 'Editar Archivo',
        }}
      />
      
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          title: 'Calendario',
        }}
      />
      
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;