# Implementación de Alerta de Creación Masiva de Plantillas

## Resumen
Se ha implementado una funcionalidad que verifica si un usuario ha utilizado la creación masiva de plantillas (`has_used_bulk_creation`). El estado se **persiste en AsyncStorage** para mantener la consistencia entre sesiones de la app. Si el usuario no ha creado sus plantillas, se **bloquea el contenido del dashboard** y se muestra una alerta obligatoria con dos opciones:

1. **Crear Plantillas** (botón verde): Crea automáticamente las plantillas usando el nombre del estudiante
2. **Cerrar Aplicación**: Sale de la aplicación

## Archivos Modificados

### 1. `src/services/files.ts`
- **Cambio**: Agregada función `bulkCreateTemplates`
- **Descripción**: Llama al endpoint `/api/bulk-template-creator` con los siguientes parámetros:
  - `user_id`: ID del usuario
  - `title_prefix`: Nombre del estudiante (usado como prefijo del título)
  - `bulk_description`: Nombre del estudiante (usado como descripción)

### 2. `src/services/dashboard.ts` (NUEVO)
- **Descripción**: Nuevo servicio para obtener estadísticas del dashboard
- **Función**: `getDashboardStats()` - Llama a `/api/dashboard/stats` y retorna:
  ```typescript
  {
    stats: { files, calendar, activity, progress },
    user_info: {
      id: number,
      name: string,
      email: string,
      has_used_bulk_creation: boolean
    },
    last_updated: string
  }
  ```

### 3. `src/screens/app/DashboardScreen.tsx`
- **Cambios principales**:
  1. Importado `AsyncStorage` de React Native
  2. Importado `dashboardService` y `useAlert`
  3. Definida constante `BULK_CREATION_KEY = "has_used_bulk_creation"`
  
  4. Agregados estados:
     - `hasUsedBulkCreation`: Rastrea si el usuario ha usado bulk creation
     - `creatingTemplates`: Indica si se están creando plantillas
     - `bulkAlertState`: Estado para la alerta de bulk creation
  
  5. **Persistencia con AsyncStorage**:
     - `useEffect` inicial: Carga el estado desde AsyncStorage al montar el componente
     - `loadDashboardData`: Guarda el estado del servidor en AsyncStorage
     - `handleCreateTemplates`: Actualiza AsyncStorage cuando se crean las plantillas
  
  6. **Bloqueo de Contenido**:
     - Si `hasUsedBulkCreation === false`: Muestra vista bloqueada con icono de candado
     - Si `hasUsedBulkCreation === true`: Muestra contenido normal del dashboard
  
  7. Modificada función `loadDashboardData`:
     - Llama a `dashboardService.getDashboardStats()`
     - Verifica `has_used_bulk_creation` del servidor
     - **Guarda en AsyncStorage** para persistencia
     - **Solo carga archivos y eventos si `hasUsedBulkCreation === true`**
     - Muestra alerta si es `false`
  
  8. Agregadas funciones:
     - `showBulkCreationAlert()`: Muestra la alerta con tipo 'success' (botón verde)
     - `handleCreateTemplates()`: Maneja la creación de plantillas
       - Llama a `filesService.bulkCreateTemplates()`
       - Usa el nombre del usuario para `title_prefix` y `bulk_description`
       - **Actualiza AsyncStorage con 'true'**
       - Muestra mensaje de éxito o error
       - Si hay error, ofrece reintentar o cerrar la app
     - `handleExitApp()`: Cierra la aplicación usando `BackHandler.exitApp()`
  
  9. **Renderizado Condicional**:
     - Agregada vista `blockedContent` cuando `!hasUsedBulkCreation`
     - Todo el contenido del dashboard (stats, archivos, eventos) solo se muestra si `hasUsedBulkCreation === true`
  
  10. Agregado segundo componente `CustomAlert` para la alerta de bulk creation
  
  11. **Estilos Agregados**:
      - `blockedContent`: Vista centrada con padding
      - `blockedTitle`: Título del mensaje de bloqueo
      - `blockedMessage`: Mensaje explicativo del bloqueo

## Flujo de Usuario

1. **Primera vez / Sin plantillas**:
   - Usuario inicia sesión y accede al Dashboard
   - AsyncStorage no tiene el valor o tiene 'false'
   - El Dashboard carga estadísticas desde `/api/dashboard/stats`
   - Si `user_info.has_used_bulk_creation === false`:
     - Se guarda 'false' en AsyncStorage
     - **NO se cargan archivos ni eventos**
     - Se muestra vista bloqueada con icono de candado
     - Se muestra alerta: "Acción Requerida" (tipo success - botón verde)
     - Mensaje: "Para comenzar a usar la aplicación, necesitas crear tus plantillas de archivos..."
     - **Botón verde**: "Crear Plantillas"
     - Botón secundario: "Cerrar Aplicación"

2. **Usuario selecciona "Crear Plantillas"**:
   - Se llama a `/api/bulk-template-creator` con:
     ```json
     {
       "user_id": <id_del_usuario>,
       "title_prefix": "<nombre_del_estudiante>",
       "bulk_description": "<nombre_del_estudiante>"
     }
     ```
   - Si tiene éxito:
     - Se actualiza AsyncStorage a 'true'
     - Se actualiza estado local a `true`
     - Muestra mensaje de éxito
     - Recarga el dashboard (ahora mostrará el contenido)
   - Si falla:
     - Muestra error con opciones:
       - "Reintentar": Vuelve a intentar crear plantillas
       - "Cerrar Aplicación": Sale de la app

3. **Usuario selecciona "Cerrar Aplicación"**:
   - La app se cierra inmediatamente usando `BackHandler.exitApp()`

4. **Próximas sesiones**:
   - Al abrir la app, se carga el valor desde AsyncStorage
   - Si es 'true', se muestra el dashboard normalmente
   - Si es 'false', se repite el flujo de bloqueo
   - El servidor siempre tiene la verdad absoluta y actualiza AsyncStorage

## Persistencia de Datos

### AsyncStorage Key
- **Clave**: `"has_used_bulk_creation"`
- **Valores**: `"true"` o `"false"` (como strings)

### Flujo de Sincronización
1. **Al montar el componente**: Lee de AsyncStorage
2. **Al cargar datos del dashboard**: Sincroniza con el servidor y actualiza AsyncStorage
3. **Al crear plantillas**: Actualiza AsyncStorage a 'true'

### Ventajas
- ✅ **Persistencia entre sesiones**: El usuario no ve el dashboard hasta crear plantillas, incluso si cierra y abre la app
- ✅ **Sincronización con servidor**: El valor del servidor siempre prevalece
- ✅ **Experiencia fluida**: No hay parpadeos ni cargas innecesarias
- ✅ **Bloqueo efectivo**: El contenido no se carga hasta que se completa la acción

## Características Clave

- ✅ **Acción obligatoria**: El usuario debe elegir una de las dos opciones
- ✅ **Botón verde**: El botón "Crear Plantillas" es verde (tipo 'success')
- ✅ **Usa el nombre del estudiante**: Tanto para `title_prefix` como `bulk_description`
- ✅ **Manejo de errores robusto**: Ofrece reintentar si falla la creación
- ✅ **Integración con sistema existente**: Usa `CustomAlert` y `useAlert` del proyecto
- ✅ **Estado de carga**: Muestra feedback durante la creación de plantillas
- ✅ **Persistencia con AsyncStorage**: El estado se mantiene entre sesiones
- ✅ **Bloqueo de contenido**: El dashboard no muestra datos hasta que se crean las plantillas
- ✅ **Vista bloqueada**: Muestra icono de candado y mensaje explicativo

## Notas Técnicas

- La alerta usa tipo 'success' para que el botón primario sea verde (#10B981)
- El valor en AsyncStorage se guarda como string ('true' o 'false')
- El servidor es la fuente de verdad y siempre actualiza AsyncStorage
- El contenido del dashboard (archivos, eventos, stats) NO se carga si `hasUsedBulkCreation === false`
- La vista bloqueada usa `MaterialCommunityIcons` con el icono "lock-outline"

## Lint Errors Existentes

Los errores de lint mostrados son pre-existentes en el código y están relacionados con:
- Tipos de estado de archivos (`completed` vs otros estados)
- Propiedades de la interfaz `File` (snake_case vs camelCase)
- Propiedades duplicadas en estilos (backgroundColor, borderRadius en menuContainer)

Estos no fueron introducidos por esta implementación y no afectan la funcionalidad nueva.
