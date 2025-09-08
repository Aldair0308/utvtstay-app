import apiClient, { handleApiError } from './api';
import {
  File,
  FileListResponse,
  FileDetailResponse,
  FileHistory,
  ApiResponse,
  PaginatedResponse,
} from '../interfaces';
import { ERROR_MESSAGES } from '../const/errors';

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
      
      const response = await apiClient.get<FileListResponse>('/files', { params });
      
      if (response.data.success && response.data.data) {
        // Mapear la respuesta de la API al formato esperado por la interfaz
        const apiFiles = response.data.data.files.map((file: any) => ({
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        }));

        return {
          files: apiFiles,
          total: response.data.data.total || apiFiles.length,
          current_page: response.data.data.current_page || page,
          per_page: response.data.data.per_page || perPage
        };
      }
      
      throw new Error('Error al obtener los archivos');
    } catch (error) {
      console.error('Error en getFiles:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener detalles de un archivo específico
   */
  getFileById: async (fileId: string): Promise<File> => {
    try {
      const response = await apiClient.get<FileDetailResponse>(`/files/${fileId}`);
      
      if (response.data.success && response.data.data && response.data.data.file) {
        const file = response.data.data.file;
        
        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        };
      }
      
      throw new Error(ERROR_MESSAGES.FILE_NOT_FOUND);
    } catch (error) {
      console.error('Error en getFileById:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar contenido de un archivo
   */
  updateFileContent: async (fileId: string, content: string): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(`/files/${fileId}/content`, {
        content,
      });
      
      if (response.data.success && response.data.data) {
        const file = response.data.data;
        
        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        };
      }
      
      throw new Error(ERROR_MESSAGES.FILE_UPDATE_ERROR);
    } catch (error) {
      console.error('Error en updateFileContent:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar información general del archivo
   */
  updateFile: async (fileId: string, data: Partial<File>): Promise<File> => {
    try {
      const response = await apiClient.put<ApiResponse<File>>(`/files/${fileId}`, data);
      
      if (response.data.success && response.data.data) {
        const file = response.data.data;
        
        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        };
      }
      
      throw new Error(ERROR_MESSAGES.FILE_UPDATE_ERROR);
    } catch (error) {
      console.error('Error en updateFile:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener historial de versiones de un archivo
   */
  getFileHistory: async (fileId: string): Promise<FileHistory[]> => {
    try {
      const response = await apiClient.get<any>(
        `/files/${fileId}/history`
      );
      
      if (response.data.success && response.data.data && response.data.data.history) {
        // Mapear la nueva estructura de respuesta del backend
        return response.data.data.history.map((item: any) => ({
          id: item.id || 0,
          file_id: parseInt(fileId) || item.file_id || 0,
          version: item.version || 1,
          content: item.content_after || item.content || '',
          changes_description: item.description || 'Sin descripción',
          created_at: item.created_at || new Date().toISOString(),
          created_by: item.user?.id || item.created_by || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error en getFileHistory:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Restaurar una versión anterior del archivo
   */
  restoreFileVersion: async (fileId: string, versionId: string): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(
        `/files/${fileId}/restore/${versionId}`
      );
      
      if (response.data.success && response.data.data) {
        const file = response.data.data;
        
        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        };
      }
      
      throw new Error(ERROR_MESSAGES.FILE_RESTORE_ERROR);
    } catch (error) {
      console.error('Error en restoreFileVersion:', error);
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
      const response = await apiClient.post<ApiResponse<File>>('/files', data);
      
      if (response.data.success && response.data.data) {
        const file = response.data.data;
        
        // Mapear la respuesta de la API al formato esperado por la interfaz
        return {
          id: file.id?.toString() || file.id,
          name: file.name || '',
          content: file.content || '',
          description: file.description || file.tutor_observations || '',
          version: file.version || 1,
          status: file.status || 'pending',
          createdAt: file.created_at || file.createdAt || new Date().toISOString(),
          updatedAt: file.updated_at || file.updatedAt || new Date().toISOString(),
          studentId: file.student_id || file.studentId || 0,
          mimeType: file.mime_type || file.mimeType || file.file_type || 'application/octet-stream',
          fileType: file.file_type || file.fileType || 'unknown',
          size: file.size || 0,
          tutorObservations: file.tutor_observations || file.tutorObservations
        };
      }
      
      throw new Error(ERROR_MESSAGES.FILE_CREATE_ERROR);
    } catch (error) {
      console.error('Error en createFile:', error);
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
        throw new Error(response.data.message || ERROR_MESSAGES.FILE_DELETE_ERROR);
      }
    } catch (error) {
      console.error('Error en deleteFile:', error);
      throw new Error(handleApiError(error));
    }
  },
};