# 📱 Manual de Usuario - UTVstay Mobile App

## 📋 Índice
1. [Introducción al Sistema](#introducción-al-sistema)
2. [Roles de Usuario](#roles-de-usuario)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Flujo de Autenticación](#flujo-de-autenticación)
5. [Guía de Pantallas](#guía-de-pantallas)
6. [Funcionalidades del Estudiante](#funcionalidades-del-estudiante)
7. [Casos de Uso Comunes](#casos-de-uso-comunes)
8. [Solución de Problemas](#solución-de-problemas)
9. [Información Técnica](#información-técnica)

---

## 🎯 Introducción al Sistema

**UTVstay Mobile App** es una aplicación móvil diseñada exclusivamente para **estudiantes** del sistema UTVstay de gestión de documentos de estadías. La aplicación permite a los estudiantes acceder a sus documentos, editarlos, revisar el historial de versiones y gestionar su calendario académico desde cualquier dispositivo móvil.

### Características Principales:
- ✅ Acceso exclusivo para estudiantes
- 📄 Gestión completa de documentos de estadía
- 📝 Editor de texto integrado
- 📅 Calendario de eventos académicos
- 🔄 Historial de versiones de documentos
- 👤 Gestión de perfil personal

---

## 👥 Roles de Usuario

### Rol Soportado: **Estudiante (Student)**

La aplicación móvil **únicamente** soporta usuarios con rol de **estudiante**. 

#### Características del Rol Estudiante:
- **Acceso**: Completo a la aplicación móvil
- **Permisos**: 
  - Ver y editar sus propios documentos
  - Acceder al calendario de eventos
  - Gestionar su perfil personal
  - Ver historial de versiones de documentos

### Roles NO Soportados:

| Rol | Acceso a App Móvil | Mensaje Mostrado |
|-----|-------------------|------------------|
| **Super Admin** | ❌ Denegado | "Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema." |
| **Admin** | ❌ Denegado | "Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema." |
| **Tutor** | ❌ Denegado | "Tu rol no es soportado por esta aplicación. Por favor, visita el sitio web para acceder al sistema." |

> **Nota**: Los usuarios con roles administrativos o de tutor deben utilizar la versión web del sistema UTVstay para acceder a todas sus funcionalidades.

---

## 📲 Instalación y Configuración

### Requisitos del Sistema:
- **Android**: Versión 6.0 o superior
- **iOS**: Versión 11.0 o superior
- **Conexión a Internet**: Requerida para todas las funcionalidades

### Proceso de Instalación:
1. Descargar la aplicación desde la tienda correspondiente
2. Instalar en el dispositivo móvil
3. Abrir la aplicación
4. Proceder con el proceso de autenticación

---

## 🔐 Flujo de Autenticación

### Pantalla de Bienvenida y Login

Al abrir la aplicación por primera vez, el usuario será dirigido automáticamente a la **Pantalla de Login**.

#### Proceso de Inicio de Sesión:

1. **Ingreso de Credenciales**:
   - **Email**: Dirección de correo electrónico institucional
   - **Contraseña**: Contraseña del sistema UTVstay

2. **Validación del Sistema**:
   - Verificación de credenciales en el servidor
   - Validación del rol de usuario
   - Generación de token de autenticación

3. **Resultados Posibles**:

   **✅ Login Exitoso (Estudiante)**:
   - Redirección automática al Dashboard
   - Sesión guardada localmente
   - Acceso completo a la aplicación

   **❌ Login Denegado (Otros Roles)**:
   - Mensaje: "Tu rol no es soportado por esta aplicación"
   - Sugerencia de usar la versión web
   - Regreso a pantalla de login

   **❌ Credenciales Incorrectas**:
   - Mensaje de error específico
   - Campos resaltados en rojo
   - Opción de reintentar

#### Persistencia de Sesión:
- La sesión permanece activa hasta el cierre manual
- No requiere login repetido al abrir la app
- Datos guardados de forma segura en el dispositivo

---

## 📱 Guía de Pantallas

### 1. 🔑 LoginScreen (Pantalla de Inicio de Sesión)

**Propósito**: Autenticar al usuario en el sistema UTVstay.

#### Elementos de la Interfaz:
- **Logo UTVstay**: Identificación visual del sistema
- **Campo Email**: Input para correo electrónico
- **Campo Contraseña**: Input con texto oculto
- **Botón "Iniciar Sesión"**: Ejecuta el proceso de autenticación
- **Indicador de Carga**: Spinner durante la validación

#### Flujo de Usuario:
1. El usuario ingresa su email institucional
2. Ingresa su contraseña
3. Presiona "Iniciar Sesión"
4. El sistema valida las credenciales
5. Si es estudiante: acceso al Dashboard
6. Si no es estudiante: mensaje de error y denegación

#### Validaciones:
- ✅ Formato de email válido
- ✅ Campos obligatorios completados
- ✅ Verificación de rol de estudiante
- ❌ Manejo de errores de conexión

---

### 2. 🏠 DashboardScreen (Pantalla Principal)

**Propósito**: Proporcionar una vista general del estado académico del estudiante.

#### Elementos de la Interfaz:
- **Barra de Navegación Superior**: 
  - Saludo personalizado ("Hola, [Nombre]")
  - Botón de perfil
- **Tarjetas de Resumen**:
  - Total de documentos
  - Documentos pendientes de revisión
  - Documentos aprobados
  - Próximos eventos
- **Accesos Rápidos**:
  - "Ver Mis Documentos"
  - "Calendario"
  - "Mi Perfil"
- **Notificaciones**: Alertas importantes o recordatorios

#### Flujo de Usuario:
1. Vista inmediata del estado general
2. Navegación rápida a secciones específicas
3. Revisión de notificaciones pendientes
4. Acceso directo a funciones principales

#### Funcionalidades:
- 📊 Estadísticas en tiempo real
- 🔔 Notificaciones push
- 🚀 Navegación rápida
- 📱 Interfaz responsive

---

### 3. 📄 FilesScreen (Pantalla de Documentos)

**Propósito**: Mostrar todos los documentos del estudiante con opciones de gestión.

#### Elementos de la Interfaz:
- **Barra de Búsqueda**: Filtro por nombre de documento
- **Filtros de Estado**:
  - Todos los documentos
  - Pendientes de revisión
  - En revisión
  - Aprobados
  - Rechazados
- **Lista de Documentos**: Cards con información resumida
- **Pull-to-Refresh**: Actualización manual de la lista

#### Información por Documento:
- 📝 Nombre del documento
- 📅 Fecha de última modificación
- 🏷️ Estado actual (badge colorido)
- 👁️ Indicador de nuevas observaciones
- ⚡ Acciones rápidas (ver, editar)

#### Flujo de Usuario:
1. Visualización de lista completa de documentos
2. Uso de filtros para encontrar documentos específicos
3. Selección de documento para ver detalles
4. Acceso directo a edición desde la lista

#### Estados de Documentos:
- 🟡 **Pendiente**: Documento creado, esperando revisión
- 🔵 **En Revisión**: Tutor revisando el documento
- 🟢 **Aprobado**: Documento aprobado por el tutor
- 🔴 **Rechazado**: Documento requiere correcciones

---

### 4. 📋 FileDetailScreen (Pantalla de Detalles del Documento)

**Propósito**: Mostrar información completa y contenido de un documento específico.

#### Elementos de la Interfaz:
- **Header del Documento**:
  - Nombre completo
  - Estado actual
  - Fecha de creación y última modificación
- **Contenido del Documento**: Texto completo con formato
- **Sección de Observaciones**:
  - Comentarios del tutor
  - Sugerencias de mejora
  - Historial de observaciones
- **Botones de Acción**:
  - "Editar Documento"
  - "Ver Historial"
  - "Compartir"

#### Flujo de Usuario:
1. Lectura completa del documento
2. Revisión de observaciones del tutor
3. Navegación a edición si es necesario
4. Consulta del historial de versiones

#### Funcionalidades Especiales:
- 📖 Modo de lectura optimizado
- 💬 Sistema de observaciones
- 🔄 Sincronización automática
- 📤 Opciones de compartir

---

### 5. ✏️ FileEditScreen (Pantalla de Edición de Documentos)

**Propósito**: Permitir la edición completa de documentos con herramientas de formato.

#### Elementos de la Interfaz:
- **Barra de Herramientas**:
  - Negrita, cursiva, subrayado
  - Listas numeradas y con viñetas
  - Alineación de texto
  - Insertar enlaces
- **Área de Edición**: Editor de texto enriquecido
- **Barra de Estado**:
  - Contador de palabras
  - Estado de guardado
  - Indicador de conexión
- **Botones de Acción**:
  - "Guardar"
  - "Vista Previa"
  - "Descartar Cambios"

#### Flujo de Usuario:
1. Apertura del documento en modo edición
2. Modificación del contenido usando herramientas
3. Guardado automático cada 30 segundos
4. Guardado manual con botón específico
5. Vista previa antes de finalizar

#### Características del Editor:
- 💾 **Guardado Automático**: Cada 30 segundos
- 🔄 **Control de Versiones**: Cada guardado crea una versión
- 📱 **Optimizado para Móvil**: Interfaz táctil intuitiva
- ⚡ **Sincronización**: Cambios reflejados inmediatamente

---

### 6. 📚 FileHistoryScreen (Pantalla de Historial de Versiones)

**Propósito**: Mostrar todas las versiones anteriores de un documento con opciones de comparación.

#### Elementos de la Interfaz:
- **Lista de Versiones**:
  - Número de versión
  - Fecha y hora de creación
  - Resumen de cambios
  - Tamaño del documento
- **Opciones por Versión**:
  - "Ver Versión"
  - "Comparar con Actual"
  - "Restaurar Versión"
- **Vista de Comparación**: Diferencias resaltadas entre versiones

#### Flujo de Usuario:
1. Visualización cronológica de todas las versiones
2. Selección de versión específica para revisar
3. Comparación entre versiones diferentes
4. Restauración de versión anterior si es necesario

#### Funcionalidades:
- 🕐 **Historial Completo**: Todas las versiones guardadas
- 🔍 **Comparación Visual**: Diferencias resaltadas
- ↩️ **Restauración**: Volver a versión anterior
- 📊 **Estadísticas**: Información de cada versión

---

### 7. 📅 CalendarScreen (Pantalla de Calendario)

**Propósito**: Mostrar eventos académicos, fechas importantes y recordatorios.

#### Elementos de la Interfaz:
- **Vista de Calendario**:
  - Navegación mensual/semanal
  - Indicadores visuales de eventos
  - Fechas importantes resaltadas
- **Lista de Eventos**: Eventos del día/semana seleccionada
- **Detalles de Eventos**:
  - Título del evento
  - Fecha y hora
  - Descripción
  - Ubicación (si aplica)

#### Tipos de Eventos:
- 📚 **Entregas**: Fechas límite de documentos
- 🎓 **Presentaciones**: Exposiciones y defensas
- 📋 **Reuniones**: Citas con tutores
- 🏫 **Eventos Institucionales**: Actividades de la universidad

#### Flujo de Usuario:
1. Navegación por meses para ver eventos
2. Selección de fecha específica
3. Visualización de detalles de eventos
4. Configuración de recordatorios

#### Funcionalidades:
- 🔔 **Notificaciones**: Recordatorios automáticos
- 🗓️ **Vistas Múltiples**: Mensual, semanal, diaria
- 🎨 **Códigos de Color**: Diferentes tipos de eventos
- 📱 **Sincronización**: Eventos actualizados en tiempo real

---

### 8. 👤 ProfileScreen (Pantalla de Perfil)

**Propósito**: Gestionar información personal y configuraciones de la aplicación.

#### Elementos de la Interfaz:
- **Información Personal**:
  - Foto de perfil
  - Nombre completo
  - Email institucional
  - Rol (Estudiante)
- **Opciones de Cuenta**:
  - "Cambiar Contraseña"
  - "Actualizar Información"
  - "Configuraciones"
- **Configuraciones de App**:
  - Notificaciones
  - Tema (claro/oscuro)
  - Idioma
- **Botón "Cerrar Sesión"**: Logout seguro

#### Flujo de Usuario:
1. Visualización de información personal
2. Modificación de datos permitidos
3. Cambio de contraseña con validaciones
4. Configuración de preferencias
5. Cierre de sesión seguro

#### Funcionalidades de Seguridad:
- 🔐 **Cambio de Contraseña**: Con validaciones robustas
- 🔒 **Logout Seguro**: Eliminación de tokens locales
- 👁️ **Información de Sesión**: Último acceso, dispositivo
- 🛡️ **Privacidad**: Control de datos personales

---

## 🎯 Funcionalidades del Estudiante

### Gestión de Documentos
- **Crear**: Nuevos documentos de estadía
- **Editar**: Modificar contenido con editor avanzado
- **Visualizar**: Lectura optimizada para móvil
- **Versionar**: Control automático de versiones
- **Compartir**: Envío de documentos por diferentes medios

### Colaboración con Tutores
- **Recibir Observaciones**: Comentarios y sugerencias
- **Responder a Feedback**: Implementar correcciones
- **Seguimiento**: Estado de revisión en tiempo real
- **Comunicación**: Canal directo con tutor asignado

### Organización Académica
- **Calendario Personal**: Eventos y fechas importantes
- **Recordatorios**: Notificaciones automáticas
- **Progreso**: Seguimiento de avance académico
- **Historial**: Registro completo de actividades

---

## 💡 Casos de Uso Comunes

### Caso 1: Editar un Documento Pendiente
1. **Inicio**: Abrir la aplicación (ya autenticado)
2. **Navegación**: Dashboard → "Ver Mis Documentos"
3. **Filtrado**: Seleccionar filtro "Pendientes"
4. **Selección**: Tocar el documento a editar
5. **Edición**: Usar el botón "Editar Documento"
6. **Modificación**: Realizar cambios necesarios
7. **Guardado**: Guardar automático o manual
8. **Finalización**: Regresar a la lista de documentos

### Caso 2: Revisar Observaciones del Tutor
1. **Notificación**: Recibir alerta de nuevas observaciones
2. **Acceso**: Tocar la notificación o ir a documentos
3. **Identificación**: Buscar documento con indicador de observaciones
4. **Lectura**: Abrir detalles del documento
5. **Revisión**: Leer observaciones en la sección correspondiente
6. **Acción**: Decidir si editar o consultar historial

### Caso 3: Consultar Calendario de Eventos
1. **Navegación**: Dashboard → "Calendario"
2. **Exploración**: Navegar por meses/semanas
3. **Selección**: Tocar fecha con eventos
4. **Detalles**: Ver información completa del evento
5. **Recordatorio**: Configurar alerta si es necesario

### Caso 4: Cambiar Contraseña
1. **Acceso**: Dashboard → Perfil (icono superior)
2. **Opción**: Seleccionar "Cambiar Contraseña"
3. **Validación**: Ingresar contraseña actual
4. **Nueva Contraseña**: Crear nueva contraseña segura
5. **Confirmación**: Repetir nueva contraseña
6. **Guardado**: Confirmar cambio
7. **Verificación**: Recibir confirmación del sistema

---

## 🔧 Solución de Problemas

### Problemas de Conexión

**Síntoma**: "Error de conexión" o "Sin internet"
**Soluciones**:
1. ✅ Verificar conexión WiFi o datos móviles
2. ✅ Reiniciar la aplicación
3. ✅ Verificar estado del servidor UTVstay
4. ✅ Contactar soporte técnico si persiste

### Problemas de Autenticación

**Síntoma**: "Credenciales incorrectas" repetidamente
**Soluciones**:
1. ✅ Verificar email y contraseña correctos
2. ✅ Usar "Olvidé mi contraseña" en la web
3. ✅ Verificar que el rol sea "estudiante"
4. ✅ Contactar administrador del sistema

### Problemas de Sincronización

**Síntoma**: Cambios no se guardan o no aparecen
**Soluciones**:
1. ✅ Verificar conexión a internet estable
2. ✅ Forzar sincronización (pull-to-refresh)
3. ✅ Cerrar y reabrir la aplicación
4. ✅ Verificar espacio disponible en el dispositivo

### Problemas de Rendimiento

**Síntoma**: Aplicación lenta o se cierra inesperadamente
**Soluciones**:
1. ✅ Cerrar otras aplicaciones en segundo plano
2. ✅ Reiniciar el dispositivo
3. ✅ Verificar espacio de almacenamiento disponible
4. ✅ Actualizar la aplicación a la última versión

### Problemas con el Editor

**Síntoma**: No se puede editar o formato no funciona
**Soluciones**:
1. ✅ Verificar permisos de edición del documento
2. ✅ Reiniciar la pantalla de edición
3. ✅ Verificar conexión a internet
4. ✅ Contactar soporte si el documento está corrupto

---

## 🔧 Información Técnica

### Especificaciones de la Aplicación
- **Plataforma**: React Native con Expo
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation v6
- **Almacenamiento Local**: AsyncStorage
- **Cliente HTTP**: Axios
- **Autenticación**: Token Bearer JWT

### Requisitos del Sistema
- **Android**: 6.0+ (API level 23+)
- **iOS**: 11.0+
- **RAM**: Mínimo 2GB recomendado
- **Almacenamiento**: 100MB libres
- **Internet**: Conexión estable requerida

### Seguridad y Privacidad
- 🔐 **Encriptación**: Datos sensibles encriptados localmente
- 🛡️ **Tokens**: Autenticación segura con JWT
- 🔒 **HTTPS**: Todas las comunicaciones encriptadas
- 👤 **Privacidad**: Datos personales protegidos según normativas

### Compatibilidad de API
- **Versión API**: Compatible con UTVstay Web v2.0+
- **Endpoints**: RESTful API estándar
- **Formato**: JSON para intercambio de datos
- **Autenticación**: Bearer Token en headers

### Actualizaciones
- **Frecuencia**: Actualizaciones mensuales
- **Método**: A través de tiendas de aplicaciones
- **Notificaciones**: Alertas automáticas de nuevas versiones
- **Compatibilidad**: Retrocompatible con versiones anteriores

---

## 📞 Soporte y Contacto

### Canales de Soporte
- **Email Técnico**: soporte.utvstay@universidad.edu
- **Teléfono**: +52 (xxx) xxx-xxxx
- **Horario**: Lunes a Viernes, 8:00 AM - 6:00 PM
- **Sitio Web**: https://utvstay.universidad.edu/soporte

### Recursos Adicionales
- 📖 **Documentación Web**: Guías completas en línea
- 🎥 **Videos Tutoriales**: Canal oficial de YouTube
- 💬 **Chat en Vivo**: Disponible en horario laboral
- 📧 **Newsletter**: Actualizaciones y tips mensuales

---

**Versión del Manual**: 1.0  
**Fecha de Actualización**: Enero 2025  
**Aplicación Compatible**: UTVstay Mobile App v1.0+

---

*Este manual está diseñado para proporcionar una guía completa del uso de UTVstay Mobile App. Para obtener la información más actualizada, visite nuestro sitio web oficial.*