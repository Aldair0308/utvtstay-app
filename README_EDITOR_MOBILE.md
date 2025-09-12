# API de Edición de Documentos para Aplicación Móvil

Esta documentación describe los endpoints API creados para permitir la edición de documentos desde aplicaciones móviles, replicando la funcionalidad web disponible en `write.blade.php`.

## Endpoints Disponibles

### 1. POST /api/files/{id}/content-mobile

**Actualizar contenido de documento y crear nueva versión automáticamente**

```http
POST /api/files/123/content-mobile
Authorization: Bearer {token}
Content-Type: application/json

{
    "content": "<p>Nuevo contenido del documento</p>",
    "base_change_id": 456 // Opcional: ID del cambio base desde el que se edita
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Document updated successfully",
  "version": 3,
  "change_id": 789,
  "changes_count": 1
}
```

**Características:**

- Solo funciona con documentos Word (.docx)
- Crea automáticamente una nueva versión usando FileChangeService
- Valida permisos del usuario
- Registra metadatos de la petición (IP, user agent, timestamp)
- Compara contenido para evitar versiones duplicadas

---

### 2. GET /api/files/{id}/versions

**Obtener todas las versiones de un archivo con sus cambios**

```http
GET /api/files/123/versions
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "success": true,
  "file": {
    "id": 123,
    "name": "documento.docx",
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "current_version": 3
  },
  "versions": [
    {
      "id": 789,
      "version": 3,
      "change_type": "replace",
      "user_email": "usuario@ejemplo.com",
      "created_at": "2024-01-15T10:30:00.000Z",
      "content_hash": "abc123...",
      "metadata": {
        "timestamp": "2024-01-15T10:30:00.000Z",
        "user_agent": "MobileApp/1.0",
        "ip_address": "192.168.1.100",
        "api_request": true
      }
    }
  ],
  "total_versions": 3
}
```

---

### 3. POST /api/files/{id}/versions/{versionId}/edit

**Editar desde una versión específica**

```http
POST /api/files/123/versions/456/edit
Authorization: Bearer {token}
Content-Type: application/json

{
    "content": "<p>Contenido editado desde versión específica</p>"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Document updated from version 2",
  "version": 4,
  "change_id": 890,
  "base_version": 2,
  "changes_count": 1
}
```

**Características:**

- Reconstruye el contenido hasta la versión especificada usando FileChangeService
- Crea una nueva versión basada en el contenido de la versión seleccionada
- Útil para crear ramas de edición desde puntos específicos en el historial

---

### 4. GET /api/files/{id}/editor-content

**Obtener contenido formateado para el editor móvil**

```http
GET /api/files/123/editor-content
Authorization: Bearer {token}

# Opcional: obtener contenido de versión específica
GET /api/files/123/editor-content?version_id=456
```

**Respuesta para documento Word:**

```json
{
  "success": true,
  "file": {
    "id": 123,
    "name": "documento.docx",
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 15420,
    "is_word": true,
    "is_excel": false,
    "is_pdf": false,
    "editable": true
  },
  "content": {
    "type": "html",
    "data": "<p>Contenido HTML del documento</p>",
    "editable": true
  },
  "version": 3,
  "total_versions": 3,
  "last_modified": "2024-01-15T10:30:00.000Z"
}
```

**Respuesta para archivo Excel:**

```json
{
  "content": {
    "type": "excel",
    "data": "Excel content preview not available via API",
    "editable": false,
    "message": "Excel files can only be viewed, not edited via mobile API"
  }
}
```

---

## Flujo de Trabajo Recomendado

### Para Editar un Documento:

1. **Obtener contenido inicial:**

   ```http
   GET /api/files/{id}/editor-content
   ```

2. **Mostrar contenido en editor móvil** (solo si `editable: true`)

3. **Guardar cambios:**
   ```http
   POST /api/files/{id}/content
   {
       "content": "<p>Contenido modificado</p>"
   }
   ```

### Para Trabajar con Versiones:

1. **Listar versiones disponibles:**

   ```http
   GET /api/files/{id}/versions
   ```

2. **Obtener contenido de versión específica:**

   ```http
   GET /api/files/{id}/editor-content?version_id={versionId}
   ```

3. **Editar desde versión específica:**
   ```http
   POST /api/files/{id}/versions/{versionId}/edit
   {
   ```

**NOTA IMPORTANTE:** Los endpoints móviles han sido renombrados para evitar conflictos con la funcionalidad web:

- Los métodos del API móvil ahora tienen sufijo "Mobile" en el controlador
- El endpoint principal de actualización es `/api/files/{id}/content-mobile`
- La funcionalidad web permanece intacta en `/api/files/{id}/content`
  "content": "<p>Nuevo contenido basado en versión anterior</p>"
  }

  ```

  ```

---

## Validaciones y Restricciones

### Permisos:

- El usuario debe ser propietario del archivo O tener rol de 'tutor'
- Todos los endpoints requieren autenticación Bearer token

### Tipos de Archivo:

- **Editable:** Solo documentos Word (.docx)
- **Solo lectura:** Excel (.xlsx), PDF (.pdf), otros formatos

### Validaciones de Contenido:

- El contenido no puede estar vacío
- Se valida que el archivo exista
- Se verifica que la versión especificada exista

---

## Códigos de Error

| Código | Descripción                          |
| ------ | ------------------------------------ |
| 400    | Contenido vacío o datos inválidos    |
| 403    | Sin permisos para acceder al archivo |
| 404    | Archivo o versión no encontrada      |
| 500    | Error interno del servidor           |

**Ejemplo de respuesta de error:**

```json
{
  "success": false,
  "error": "Only Word documents can be updated",
  "message": "Este tipo de archivo no es compatible"
}
```

---

## Integración con FileChangeService

Todos los endpoints utilizan el `FileChangeService` existente para:

- **Cambios incrementales:** Solo se almacenan las diferencias entre versiones
- **Reconstrucción de contenido:** Se puede obtener el contenido de cualquier versión
- **Historial completo:** Cada cambio se registra con metadatos completos
- **Optimización de espacio:** Evita duplicar contenido idéntico

---

## Ejemplo de Implementación en App Móvil

```javascript
// Clase para manejar la API de documentos
class DocumentAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getEditorContent(fileId, versionId = null) {
    const url = versionId
      ? `${this.baseUrl}/files/${fileId}/editor-content?version_id=${versionId}`
      : `${this.baseUrl}/files/${fileId}/editor-content`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    return await response.json();
  }

  async updateContent(fileId, content, baseChangeId = null) {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/content`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        base_change_id: baseChangeId,
      }),
    });

    return await response.json();
  }

  async getVersions(fileId) {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/versions`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    return await response.json();
  }
}
```

---

## Pruebas

Puedes usar el archivo `test_mobile_endpoints.php` incluido para probar todos los endpoints:

```bash
php test_mobile_endpoints.php
```

Asegúrate de:

1. Tener el servidor Laravel ejecutándose
2. Configurar un token de autenticación válido
3. Usar un ID de archivo existente en el asyncstorage
