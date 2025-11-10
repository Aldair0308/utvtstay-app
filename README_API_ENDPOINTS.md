# UTVstay Mobile API — Edición y Renderización de Archivos

Este documento describe únicamente los endpoints relacionados con:

- Renderización/previsualización de contenido de archivos
- Edición de documentos desde el móvil (editor actual y legacy)
- Historial y versiones de archivos
- Visualización y detalle de cambios incrementales
- Registro de cambios

Importante: se omite explícitamente el endpoint de restauración (`POST /api/files/{id}/restore/{version}`) según la solicitud.

## Autenticación y Headers

- Autenticación: `auth:sanctum` (Bearer Token)
- Header recomendado: `Authorization: Bearer <token>`
- Acepta y devuelve: `application/json`

## Endpoints de Archivos (render, editor y versiones)

### Obtener contenido para previsualización/render

- Método y ruta: `GET /api/files/{id}/content`
- Requiere: propietario del archivo (`responsible_email` igual al usuario autenticado)
- Respuesta (genérica):
  - `success`: boolean
  - `data.content`: string (HTML o texto según tipo)
  - `data.mime_type`: string (típicamente `text/html`)
  - `data.html`: string (igual a `content` cuando es HTML)
- Comportamiento por tipo:
  - HTML template: retorna HTML crudo de la plantilla sin inyección de datos.
  - PDF: retorna un HTML con enlace para ver el PDF.
  - Excel: genera una tabla HTML limitada (máx. 100 filas, 20 columnas) para preview.
  - Word: retorna el HTML generado del documento.
  - Texto/otros: convierte el contenido a `<pre>` dentro de HTML.
- Errores comunes: `403` (sin permisos), `404` plantilla no encontrada, `400` plantilla sin HTML, `500` internos.

### Listar historial de versiones y cambios

- Método y ruta: `GET /api/files/{id}/history`
- Requiere: propietario del archivo
- Respuesta:
  - `success`: boolean
  - `message`: string
  - `data.history`: array mixto con elementos de tipo `file_version` y `incremental_change`.
    - `file_version`: `id`, `file_id`, `version`, `created_at`, `size`, `mime_type`, `description`, `original_name`, `has_changes`, `user { id, name }`
    - `incremental_change`: `id`, `file_id`, `version` (formato `X.<changeId>`), `created_at`, `size`, `mime_type`, `description`, `change_type`, `parent_version`, `parent_file_id`, `content_before`, `content_after`, `observations`, `user { id, name }`
  - `data.total_versions`: número total de elementos en `history`
  - `data.file_info`: `id`, `name`, `description`
- Errores comunes: `403` sin permisos.

### Listar versiones (cambios) para el editor móvil

- Método y ruta: `GET /api/files/{id}/versions`
- Requiere: propietario del archivo
- Respuesta:
  - `success`: boolean
  - `file`: `id`, `name`, `type` (mime), `current_version`
  - `versions`: array de cambios ordenados desc por `version`:
    - `id`, `version`, `change_type`, `user_email`, `created_at` (ISO), `content_hash`, `metadata { timestamp, user_agent, ip_address, api_request, restored_from_version }`
  - `total_versions`: número de cambios
- Errores comunes: `403` sin permisos, `500` internos.

### Obtener contenido formateado para el editor móvil (actual)

- Método y ruta: `GET /api/files/{id}/editor-content`
- Query opcional:
  - `version_id`: reconstruye contenido hasta ese cambio (inyecta datos si HTML/template)
  - `changeId`: reconstruye contenido hasta ese cambio (inyecta datos si HTML template)
- Requiere: propietario del archivo
- Respuesta:
  - `success`: boolean
  - `file`: `id`, `name`, `type`, `size`, `is_word`, `is_excel`, `is_pdf`, `editable` (solo `true` para Word)
  - `content`: objeto según tipo:
    - Word: `{ type: 'html', data: '<html...>', editable: true }`
    - Excel: `{ type: 'excel', data: 'Excel content preview not available via API', editable: false, message: 'Excel files can only be viewed, not edited via mobile API' }`
    - PDF: `{ type: 'pdf', data: 'PDF content preview not available via API', editable: false, message: 'PDF files can only be viewed, not edited via mobile API' }`
    - Otros: `{ type: 'unknown', data: '<contenido>', editable: false, message: 'This file type is not supported for editing via mobile API' }`
  - `version`: número de versión asociado al contenido retornado
  - `total_versions`: total de cambios del archivo
  - `last_modified`: ISO timestamp
  - `change_id`: presente si se consultó con `changeId`
- Errores comunes: `403` sin permisos, `404` versión no encontrada, `500` internos.

### Obtener contenido crudo para el editor móvil (legacy)

- Método y ruta: `GET /api/files/{id}/editor-content-legacy`
- Query opcional:
  - `version_id`: reconstruye contenido crudo hasta ese cambio
  - `changeId`: reconstruye contenido crudo hasta ese cambio
- Requiere: propietario del archivo
- Respuesta:
  - `success`: boolean
  - `data.content`: string (contenido crudo sin inyección)
  - `data.metadata`: `{ version, lastModified (ISO), wordCount, characterCount }`
- Errores comunes: `403`, `404` versión no encontrada, `500`.

### Actualizar contenido (crea nueva versión automáticamente)

- Método y ruta: `POST /api/files/{id}/content-mobile`
- Requiere: propietario del archivo y que el archivo sea Word (`isWord=true`)
- Body (JSON):
  - `content`: string (HTML enriquecido del documento Word)
  - `base_change_id`: string opcional (si el cliente quiere referenciar un cambio base)
- Respuesta (sin cambios):
  - `success`: true
  - `message`: `No changes detected`
  - `version`: versión actual
- Respuesta (con actualización):
  - `success`: true
  - `message`: `Document updated successfully`
  - `version`: nueva versión
  - `change_id`: id del cambio creado
  - `changes_count`: 1
- Errores comunes: `400` contenido vacío o archivo no-Word, `403` sin permisos, `500` internos.

### Editar documento desde una versión específica

- Método y ruta: `POST /api/files/{id}/versions/{versionId}/edit`
- Requiere: propietario del archivo y que el archivo sea Word
- Body (JSON):
  - `content`: string (HTML enriquecido a guardar desde la base `versionId`)
- Respuesta (sin cambios desde base):
  - `success`: true
  - `message`: `No changes detected from base version`
  - `base_version`: versión base
- Respuesta (con actualización):
  - `success`: true
  - `message`: `Document updated from version <base_version>`
  - `version`: nueva versión
  - `change_id`: id del cambio creado
  - `base_version`: versión base
  - `changes_count`: 1
- Errores comunes: `404` base no encontrada, `400` contenido vacío o archivo no-Word, `403`, `500`.

## Endpoints de Cambios (File Changes)

### Registrar un cambio (insert/delete/replace o datos JSON)

- Método y ruta: `POST /api/file-changes/`
- Requiere: propietario del archivo asociado
- Body (JSON):
  - `file_id`: integer (id del archivo)
  - `change_type`: string opcional (`insert`, `delete`, `replace`, `json_data`)
  - `position_start`: integer opcional (>= 0)
  - `position_end`: integer opcional (>= `position_start`)
  - `old_content`: string opcional
  - `new_content`: string opcional
  - `user_email`: string opcional (email)
  - `metadata`: objeto opcional
  - `version_comment`: string opcional (max 500)
  - `data`: objeto opcional (para `json_data`; si presente, se serializa en `new_content`)
- Reglas:
  - Si `data` existe: `change_type` por defecto `json_data`, posiciones `0`, y `new_content` se rellena con `json_encode(data)`.
  - En cambios regulares (sin `data`): se requiere `change_type` y `position_end >= position_start`.
- Respuesta:
  - `success`: true
  - `message`: `JSON template data registered successfully` (si incluye `data`) o `File change registered successfully`
  - `data`: `{ change_id, version, file_id, change_type, content_hash, created_at, data?, version_number? }`
- Errores comunes: `422` validación, `403` sin permisos, `500` internos.

### Ver contenido renderizado de un cambio

- Método y ruta: `GET /api/file-changes/{id}/content`
- Requiere: propietario del archivo
- Respuesta (HTML/template):
  - `success`: true
  - `data.file_change`: `id`, `change_type`, `created_at`, `observations`
  - `data.file`: `id`, `name`, `mime_type`, `size`
  - `data.content`: HTML renderizado (con inyección de datos si aplica)
  - `data.content_type`: `html`
  - `data.has_new_content`: boolean
- Respuesta (Excel grande):
  - `success`: true
  - `data.preview_data`: matriz de celdas (`rangeToArray` limitado)
  - `data.content_type`: `excel`
- Respuesta (PDF):
  - `success`: true
  - `data.content`: URL de preview del PDF
  - `data.content_type`: `pdf`
- Respuesta (Word):
  - `success`: true
  - `data.content`: HTML generado
  - `data.content_type`: `html`
- Errores comunes: `403`, `404` plantilla/datos inválidos, `500`.

### Ver detalle de un cambio

- Método y ruta: `GET /api/file-changes/{id}`
- Requiere: propietario del archivo
- Respuesta:
  - `success`: true
  - `data.file_change`: `id`, `change_type`, `position_start`, `position_end`, `old_content`, `new_content`, `content_hash`, `metadata`, `observations`, `is_checked`, `created_at`, `updated_at`, `user { email, name }`
  - `data.file`: `id`, `name`, `description`, `mime_type`, `size`
- Errores comunes: `403` sin permisos.

## Consideraciones de permisos y tipos

- Solo el tutor o el responsable del archivo (`responsible_email`) puede acceder/editar.
- Edición vía API solamente soportada para documentos Word (`isWord=true`).
- Excel y PDF: solo vista previa; no son editables por el editor móvil.

## Códigos de error típicos

- `400` Petición inválida (contenido vacío, tipo de archivo no soportado)
- `403` Acceso prohibido (no es el responsable ni tutor)
- `404` Recurso no encontrado (versión/cambio/plantilla)
- `422` Error de validación
- `500` Error interno del servidor

## Ejemplos rápidos

- Actualizar documento Word (crear nueva versión):

```
POST /api/files/123/content-mobile
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "<html><body><p>Nuevo contenido</p></body></html>",
  "base_change_id": "456"
}
```

- Obtener contenido para editor móvil con `version_id`:

```
GET /api/files/123/editor-content?version_id=456
Authorization: Bearer <token>
Accept: application/json
```

- Registrar datos JSON en un cambio:

```
POST /api/file-changes/
Authorization: Bearer <token>
Content-Type: application/json

{
  "file_id": 123,
  "data": { "nombre": "Juan", "grupo": "A1" },
  "version_comment": "Datos del template"
}
```

Librería Uso principal Notas
xlsx (SheetJS) Leer/escribir archivos Excel (.xls, .xlsx, .csv) 📦 npm install xlsx o yarn add xlsx. Funciona en React Native con polyfills.
