# UTVstay Mobile App - Aplicación Móvil para Estudiantes

## 📱 Descripción del Proyecto

Aplicación móvil exclusiva para **estudiantes** del sistema UTVstay de gestión de documentos de estadías. Desarrollada con **React Native Expo** y **TypeScript** usando la plantilla blank.

## 🎯 Objetivo

Crear una aplicación móvil que permita a los estudiantes acceder únicamente a las funcionalidades que les corresponden del sistema web UTVstay, con una experiencia de usuario optimizada para dispositivos móviles.

## 🔐 Restricciones de Acceso

- **SOLO ESTUDIANTES**: La app únicamente permitirá el acceso a usuarios con rol `student`
- **Otros roles**: Si un usuario con rol `admin`, `tutor` u otro intenta acceder, se mostrará el mensaje: _"Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema."_

## 🏗️ Arquitectura de la Aplicación

### Stack Tecnológico

- **Framework**: React Native con Expo
- **Lenguaje**: TypeScript
- **Plantilla**: Expo Blank (TypeScript)
- **Navegación**: React Navigation v6 (Stack Navigator)
- **Almacenamiento**: AsyncStorage
- **Gestión de Estado**: Context API (AuthContext)
- **HTTP Client**: Axios

### Estructura de Navegación

La aplicación tendrá **dos navegaciones principales**:

#### 1. **AuthStack** (Navegación de Autenticación)

- `LoginScreen` - Pantalla de inicio de sesión

#### 2. **AppStack** (Navegación Principal)

- `DashboardScreen` - Dashboard principal
- `FilesScreen` - Lista de archivos del estudiante
- `FileDetailScreen` - Detalles y visualización de archivo
- `FileHistoryScreen` - Historial de versiones del archivo
- `FileEditScreen` - Editor de documentos
- `CalendarScreen` - Calendario de eventos
- `ProfileScreen` - Perfil del usuario

## 🔑 Sistema de Autenticación

### Endpoint de Login

```
POST /api/login
```

### Respuesta Exitosa del Login

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 3,
      "name": "Student User",
      "email": "student@example.com",
      "email_verified_at": null,
      "created_at": "2025-08-04T01:42:38.000000Z",
      "updated_at": "2025-08-04T01:42:38.000000Z",
      "roles": ["student"]
    },
    "token": "2|JYJ8wuA3pmK6rOlzQWsSgElswa72Rmsgf74F1yzK8322fba5",
    "token_type": "Bearer"
  }
}
```

### AuthContext

```typescript
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}
```

### Persistencia de Sesión

La aplicación guardará en **AsyncStorage**:

- `userToken`: Token de autenticación
- `userData`: Información del usuario (id, name, email)
- `isLoggedIn`: Estado de autenticación

La sesión permanecerá activa hasta que:

- El usuario cierre sesión manualmente
- El usuario desinstale la aplicación
- El usuario borre los datos de la aplicación

## 📱 Pantallas de la Aplicación

### 1. **LoginScreen**

**Funcionalidad:**

- Formulario de login (email/password)
- Validación de credenciales
- Verificación de rol de estudiante
- Manejo de errores de autenticación
- Indicador de carga durante el login

**Validaciones:**

- Solo permitir acceso a usuarios con rol `student`
- Mostrar mensaje de error para otros roles
- Validación de formato de email
- Campos requeridos

### 2. **DashboardScreen**

**Funcionalidad:**

- Resumen de archivos del estudiante
- Estadísticas rápidas (archivos totales, pendientes de revisión)
- Accesos rápidos a funciones principales
- Notificaciones o alertas importantes
- Calendario de eventos próximos

### 3. **FilesScreen**

**Funcionalidad:**

- Lista de todos los archivos del estudiante
- Filtros por estado (pendiente, revisado, etc.)
- Búsqueda de archivos
- Indicadores visuales de estado
- Pull-to-refresh
- Paginación infinita

### 4. **FileDetailScreen**

**Funcionalidad:**

- Visualización del contenido del archivo
- Información del archivo (nombre, fecha, versión)
- Observaciones del tutor
- Botones de acción (editar, ver historial)
- Estado de revisión

### 5. **FileHistoryScreen**

**Funcionalidad:**

- Lista de todas las versiones del archivo
- Comparación entre versiones
- Información de cambios incrementales
- Fechas de modificación
- Posibilidad de restaurar versiones anteriores

### 6. **FileEditScreen**

**Funcionalidad:**

- Editor de texto enriquecido
- Guardado automático
- Vista previa del documento
- Control de versiones
- Indicador de cambios no guardados

### 7. **CalendarScreen**

**Funcionalidad:**

- Vista de calendario mensual/semanal
- Eventos y fechas importantes
- Detalles de eventos al tocar
- Navegación entre meses
- Indicadores visuales de eventos

### 8. **ProfileScreen**

**Funcionalidad:**

- Información del perfil del estudiante
- Cambio de contraseña
- Configuraciones de la aplicación
- Cerrar sesión
- Información de la cuenta

## 🌐 Endpoints de API Necesarios

### Autenticación

```
POST /api/login
GET /api/user
POST /api/logout
```

### Archivos

```
GET /api/files (lista de archivos del estudiante)
GET /api/files/{id} (detalles del archivo)
PUT /api/files/{id} (actualizar archivo)
GET /api/files/{id}/history (historial de versiones)
POST /api/files/{id}/content (actualizar contenido)
```

### Calendario

```
GET /api/events (eventos del calendario)
POST /api/events (crear evento)
PUT /api/events/{id} (actualizar evento)
DELETE /api/events/{id} (eliminar evento)
```

### Perfil

```
GET /api/profile (información del perfil)
PUT /api/profile (actualizar perfil)
PUT /api/profile/password (cambiar contraseña)
```

## 🚀 Guía de Implementación

### 1. Configuración Inicial

```bash
# Crear proyecto con Expo
npx create-expo-app UTVstayMobile --template blank-typescript
cd UTVstayMobile

# Instalar dependencias necesarias
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios
npm install react-native-paper # Para componentes UI
npm install react-native-vector-icons
npm install @expo/vector-icons
```

# Ejecutar servidor local de desarrollo

```bash
npx expo start --go --clear --android
```

### 2. Estructura de Carpetas

```
proyecto-raiz/
├── App.tsx
├── src/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useStorage.ts
│   ├── interfaces/
│   │   ├── User.ts
│   │   ├── File.ts
│   │   ├── CalendarEvent.ts
│   │   └── index.ts
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   └── app/
│   │       ├── DashboardScreen.tsx
│   │       ├── FilesScreen.tsx
│   │       ├── FileDetailScreen.tsx
│   │       ├── FileHistoryScreen.tsx
│   │       ├── FileEditScreen.tsx
│   │       ├── CalendarScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── navigation/
│   │   ├── AuthStack.tsx
│   │   ├── AppStack.tsx
│   │   └── RootNavigator.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── CustomButton.tsx
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   └── FileEditForm.tsx
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   └── services/
│       ├── api.ts
│       ├── auth.ts
│       ├── files.ts
│       ├── calendar.ts
│       └── storage.ts
└── assets/
    ├── images/
    └── icons/
```

### 3. Configuración del AuthContext

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userData");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);

      if (response.success && response.data.user.roles.includes("student")) {
        const { user: userData, token: userToken } = response.data;

        await AsyncStorage.setItem("userToken", userToken);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("isLoggedIn", "true");

        setToken(userToken);
        setUser(userData);
        setIsLoggedIn(true);

        return true;
      } else if (
        response.success &&
        !response.data.user.roles.includes("student")
      ) {
        throw new Error(
          "Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema."
        );
      }

      return false;
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      await AsyncStorage.multiRemove(["userToken", "userData", "isLoggedIn"]);
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 4. Configuración de Navegación

```typescript
// src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";
import LoadingScreen from "../components/common/LoadingScreen";

const RootNavigator: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();

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
```

### 5. Servicio de API

```typescript
// src/services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://tu-dominio.com/api"; // Cambiar por la URL real

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["userToken", "userData", "isLoggedIn"]);
      // Redirigir al login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 🎨 Diseño y UX

### Paleta de Colores

- **Primario**: Verde (#10B981) - Consistente con el sistema web
- **Secundario**: Gris (#6B7280)
- **Fondo**: Blanco (#FFFFFF) / Gris oscuro (#1F2937) para modo oscuro
- **Texto**: Gris oscuro (#111827) / Blanco (#FFFFFF) para modo oscuro
- **Error**: Rojo (#EF4444)
- **Éxito**: Verde (#10B981)

### Componentes UI

- Usar React Native Paper para consistencia
- Iconos de @expo/vector-icons
- Animaciones suaves con Animated API
- Feedback visual para todas las acciones
- Loading states apropiados

## 🔧 Configuraciones Adicionales

### app.json

```json
{
  "expo": {
    "name": "UTVstay Mobile",
    "slug": "utvstay-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10B981"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## 🧪 Testing

### Casos de Prueba Principales

1. **Autenticación**

   - Login exitoso con estudiante
   - Rechazo de otros roles
   - Persistencia de sesión
   - Logout correcto

2. **Navegación**

   - Transición entre stacks
   - Navegación dentro del app
   - Manejo de deep links

3. **Funcionalidades**
   - Carga de archivos
   - Edición de documentos
   - Sincronización con API
   - Manejo de errores de red

## 📦 Deployment

### Desarrollo

```bash
npx expo start
```

### Build para Producción

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

## 🔒 Seguridad

- Validación de roles en cada request
- Tokens seguros en AsyncStorage
- Manejo seguro de errores
- Validación de entrada en formularios
- Timeout de sesión por inactividad

## 📋 Checklist de Implementación

### Fase 1: Configuración Base

- [ ] Crear proyecto Expo con TypeScript
- [ ] Configurar navegación (AuthStack/AppStack)
- [ ] Implementar AuthContext
- [ ] Configurar AsyncStorage
- [ ] Configurar cliente API (Axios)

### Fase 2: Autenticación

- [ ] Implementar LoginScreen
- [ ] Validación de rol de estudiante
- [ ] Persistencia de sesión
- [ ] Manejo de errores de login
- [ ] Loading states

### Fase 3: Pantallas Principales

- [ ] DashboardScreen
- [ ] FilesScreen con lista
- [ ] FileDetailScreen
- [ ] ProfileScreen básico

### Fase 4: Funcionalidades Avanzadas

- [ ] FileEditScreen con editor
- [ ] FileHistoryScreen
- [ ] CalendarScreen
- [ ] Sincronización offline

### Fase 5: Pulimiento

- [ ] Animaciones y transiciones
- [ ] Manejo de errores robusto
- [ ] Testing completo
- [ ] Optimización de rendimiento
- [ ] Documentación final

## 🤝 Contribución

Este README proporciona una guía completa para desarrollar la aplicación móvil UTVstay. Sigue las especificaciones técnicas y mantén la consistencia con el sistema web existente.

---

**Nota**: Recuerda actualizar las URLs de API y configuraciones específicas según tu entorno de desarrollo y producción.
