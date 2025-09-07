import apiClient, { handleApiError } from './api';
import {
  File,
  FileListResponse,
  FileDetailResponse,
  FileHistory,
  ApiResponse,
  PaginatedResponse,
} from '../interfaces';

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
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Error al obtener los archivos');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener detalles de un archivo específico
   */
  getFileById: async (fileId: number): Promise<File> => {
    try {
      const response = await apiClient.get<FileDetailResponse>(`/files/${fileId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.file;
      }
      
      throw new Error('Archivo no encontrado');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar contenido de un archivo
   */
  updateFileContent: async (fileId: number, content: string): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(`/files/${fileId}/content`, {
        content,
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Error al actualizar el archivo');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar información general del archivo
   */
  updateFile: async (fileId: number, data: Partial<File>): Promise<File> => {
    try {
      const response = await apiClient.put<ApiResponse<File>>(`/files/${fileId}`, data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Error al actualizar el archivo');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener historial de versiones de un archivo
   */
  getFileHistory: async (fileId: number): Promise<FileHistory[]> => {
    try {
      const response = await apiClient.get<ApiResponse<FileHistory[]>>(
        `/files/${fileId}/history`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Restaurar una versión anterior del archivo
   */
  restoreFileVersion: async (fileId: number, versionId: number): Promise<File> => {
    try {
      const response = await apiClient.post<ApiResponse<File>>(
        `/files/${fileId}/restore/${versionId}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Error al restaurar la versión del archivo');
    } catch (error) {
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
        return response.data.data;
      }
      
      throw new Error('Error al crear el archivo');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Eliminar un archivo
   */
  deleteFile: async (fileId: number): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(`/files/${fileId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar el archivo');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};