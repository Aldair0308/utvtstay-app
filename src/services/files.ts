import apiClient, { handleApiError } from "./api";
import {
  File,
  FileListResponse,
  FileDetailResponse,
  FileHistory,
  ApiResponse,
  PaginatedResponse,
} from "../interfaces";
import { ERROR_MESSAGES } from "../const/errors";

export const filesService = {
  /**
   * Obtener lista de archivos del estudiante
   */
  getFiles: async (
    page: number = 1,
    perPage: number = 10,
    status?: string,
    search?: string
  ): Promise<PaginatedResponse<File>> => {
    try {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (status) params.status = status;
      if (search) params.search = search;

      const response = await apiClient.get<FileListResponse>("/files", {
        params,
      });

      if (response.data.success && response.data.data) {
        // Mapear la respuesta de la API al formato esperado por la interfaz
        const apiFiles = response.data.data.files.map((file: any) => ({
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        }));

        return {
          files: apiFiles,
          total: response.data.data.total || apiFiles.length,
          current_page: response.data.data.current_page || page,
          per_page: response.data.data.per_page || perPage,
        };
      }

      throw new Error("Error al obtener los archivos");
    } catch (error) {
      console.error("Error en getFiles:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener detalles de un archivo específico
   */
  getFileById: async (fileId: string): Promise<File> => {
    try {
      const response = await apiClient.get<FileDetailResponse>(
        `/files/${fileId}`
      );

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.file
      ) {
        const file = response.data.data.file;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_NOT_FOUND);
    } catch (error) {
      console.error("Error en getFileById:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar contenido de un archivo
   */
  updateFileContent: async (fileId: string, content: string): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(
        `/files/${fileId}/content`,
        {
          content,
        }
      );

      if (response.data.success && response.data.data) {
        const file = response.data.data;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_UPDATE_ERROR);
    } catch (error) {
      console.error("Error en updateFileContent:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar información general del archivo
   */
  updateFile: async (fileId: string, data: Partial<File>): Promise<File> => {
    try {
      const response = await apiClient.put<ApiResponse<File>>(
        `/files/${fileId}`,
        data
      );

      if (response.data.success && response.data.data) {
        const file = response.data.data;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_UPDATE_ERROR);
    } catch (error) {
      console.error("Error en updateFile:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener historial de versiones de un archivo
   */
  getFileHistory: async (fileId: string): Promise<FileHistory[]> => {
    try {
      const response = await apiClient.get<any>(`/files/${fileId}/history`);

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.history
      ) {
        // Mapear la nueva estructura de respuesta del backend
        return response.data.data.history.map((item: any) => ({
          id: item.id || 0,
          file_id: parseInt(fileId) || item.file_id || 0,
          version: item.version || 1,
          content: item.content_after || item.content || "",
          changes_description: item.description || "Sin descripción",
          created_at: item.created_at || new Date().toISOString(),
          created_by: item.user?.id || item.created_by || 0,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error en getFileHistory:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Restaurar una versión anterior del archivo
   */
  restoreFileVersion: async (
    fileId: string,
    versionId: string
  ): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(
        `/files/${fileId}/restore/${versionId}`
      );

      if (response.data.success && response.data.data) {
        const file = response.data.data;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_RESTORE_ERROR);
    } catch (error) {
      console.error("Error en restoreFileVersion:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Crear un nuevo archivo
   */
  createFile: async (data: {
    name: string;
    content: string;
    file_type: string;
  }): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>("/files", data);

      if (response.data.success && response.data.data) {
        const file = response.data.data;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_CREATE_ERROR);
    } catch (error) {
      console.error("Error en createFile:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Eliminar un archivo
   */
  deleteFile: async (fileId: string): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(`/files/${fileId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || ERROR_MESSAGES.FILE_DELETE_ERROR
        );
      }
    } catch (error) {
      console.error("Error en deleteFile:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener contenido del editor para móvil
   */
  // getEditorContent: registra WARN cuando el archivo no es Word y activa fallback controlado
  getEditorContent: async (
    fileId: string,
    versionId?: string
  ): Promise<any> => {
    try {
      const url = versionId
        ? `/files/${fileId}/editor-content?version_id=${versionId}`
        : `/files/${fileId}/editor-content`;
  
      console.log(`[FilesService] Getting editor content for file ${fileId}`, {
        url,
        versionId,
      });
  
      const response = await apiClient.get<ApiResponse<any>>(url);
  
      console.log(`[FilesService] Editor content response:`, {
        success: response.data.success,
        hasData: !!response.data.data,
        status: response.status,
      });
  
      if (response.data.success && response.data.data) {
        // Adjuntar cuerpo crudo para depuración en pantallas que lo requieran
        try {
          const rawBody = JSON.stringify(response.data);
          return { ...response.data.data, __rawResponse: rawBody };
        } catch {
          return response.data.data;
        }
      }
  
      throw new Error("Error al obtener contenido del editor");
    } catch (error: any) {
      const isNonWordEditorContent =
        error?.response?.status === 500 &&
        String(error?.response?.data?.message || "").toLowerCase().includes("not a word document");
  
      if (isNonWordEditorContent) {
        // Devolver un objeto controlado indicando que es Excel para que FileEditScreen active su ruta Excel sin errores
        return {
          file: {
            id: Number(fileId),
            name: "Archivo",
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: 0,
            is_word: false,
            is_excel: true,
            is_pdf: false,
            editable: false,
          },
          content: {
            type: "excel",
            data: "",
            editable: false,
            message: "Excel detectado vía editor-content",
          },
          version: 1,
          total_versions: 1,
          last_modified: new Date().toISOString(),
        };
      }
  
      console.error(
        `[FilesService] Error en getEditorContent para archivo ${fileId}:`,
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        }
      );
  
      if (error.response?.status === 403) {
        throw new Error(
          "No tienes permisos para editar este archivo. Verifica que tengas los permisos necesarios o contacta al administrador."
        );
      }
  
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar contenido para móvil
   */
  updateContentMobile: async (
    fileId: string,
    content: string,
    versionMessage?: string
  ): Promise<any> => {
    try {
      const payload = {
        content,
        version_message: versionMessage || "Actualización desde móvil",
      };

      console.log(`[FilesService] Updating content for file ${fileId}:`, {
        contentLength: content.length,
        versionMessage: payload.version_message,
      });

      const response = await apiClient.post<ApiResponse<any>>(
        `/files/${fileId}/content-mobile`,
        payload
      );

      console.log(`[FilesService] Update content response:`, {
        success: response.data.success,
        hasData: !!response.data.data,
        status: response.status,
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error("Error al actualizar contenido");
    } catch (error: any) {
      console.error(
        `[FilesService] Error en updateContentMobile para archivo ${fileId}:`,
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        }
      );

      if (error.response?.status === 403) {
        throw new Error(
          "No tienes permisos para modificar este archivo. Verifica que tengas los permisos de escritura necesarios."
        );
      }

      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener versiones de un archivo
   */
  getFileVersions: async (fileId: string): Promise<any> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/files/${fileId}/versions`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Error al obtener versiones del archivo");
    } catch (error) {
      console.error("Error en getFileVersions:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Editar desde una versión específica
   */
  editFromVersion: async (
    fileId: string,
    versionId: string,
    content: string
  ): Promise<any> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/files/${fileId}/versions/${versionId}/edit`,
        {
          content,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Error al editar desde versión");
    } catch (error) {
      console.error("Error en editFromVersion:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener contenido de un archivo
   */
  getFileContent: async (fileId: string): Promise<{ content: string; mimeType: string; html?: string }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ content: string; mime_type: string; html?: string }>
      >(`/files/${fileId}/content`);

      if (response.data.success && response.data.data) {
        return {
          content: response.data.data.content,
          mimeType: response.data.data.mime_type,
          html: response.data.data.html,
        };
      }

      throw new Error(
        response.data.message || "Error al obtener contenido del archivo"
      );
    } catch (error) {
      console.error("Error en getFileContent:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar contenido de un archivo con tipo MIME específico
   */
  updateFileContentWithMime: async (
    fileId: string, 
    content: string, 
    mimeType: string = 'text/plain'
  ): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(
        `/files/${fileId}/content`,
        {
          content,
          mime_type: mimeType
        }
      );

      if (response.data.success && response.data.data) {
        const file = response.data.data;

        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || "",
          content: file.content || "",
          description: file.description || file.tutor_observations || "",
          version: file.version || 1,
          status: file.status || "pending",
          createdAt:
            file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt:
            file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType:
            file.mime_type ||
            file.mimeType ||
            file.file_type ||
            "application/octet-stream",
          fileType: file.file_type || file.fileType || "unknown",
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations,
        };
      }

      throw new Error(ERROR_MESSAGES.FILE_UPDATE_ERROR);
    } catch (error) {
      console.error("Error en updateFileContentWithMime:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtiene el contenido de un cambio específico de archivo
   * @param changeId - ID del cambio
   * @returns Contenido del cambio con información adicional
   */
  getFileChangeContent: async (changeId: string): Promise<any> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/file-changes/${changeId}/content`
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          content: data.content || "",
          mimeType: data.file?.mime_type || "text/plain",
          content_type: data.content_type,
          has_new_content: data.has_new_content,
          file_change: data.file_change,
          file: data.file,
        };
      }

      throw new Error(
        response.data.message || "Error al obtener contenido del cambio"
      );
    } catch (error) {
      console.error("Error en getFileChangeContent:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener detalles de un cambio específico
   */
  getFileChangeDetails: async (changeId: string): Promise<any> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/file-changes/${changeId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Error al obtener detalles del cambio"
      );
    } catch (error) {
      console.error("Error en getFileChangeDetails:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Registrar un cambio de archivo (incluye soporte para data JSON)
   * Respeta README_API_ENDPOINTS: POST /api/file-changes/
   */
  registerFileChange: async (payload: {
    file_id: number | string;
    change_type?: string;
    position_start?: number;
    position_end?: number;
    old_content?: string;
    new_content?: string;
    user_email?: string;
    metadata?: any;
    version_comment?: string;
    data?: any;
  }): Promise<any> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/file-changes/`,
        payload
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Error al registrar el cambio del archivo"
      );
    } catch (error: any) {
      console.error("Error en registerFileChange:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      if (error.response?.status === 403) {
        throw new Error(
          "No tienes permisos para registrar cambios en este archivo."
        );
      }
      throw new Error(handleApiError(error));
    }
  },
};
