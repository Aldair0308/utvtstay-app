import apiClient, { handleApiError } from './api';
import {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventRequest,
  ApiResponse,
} from '../interfaces';
import { ERROR_MESSAGES } from '../const/errors';

export const calendarService = {
  /**
   * Obtener eventos del calendario
   */
  getEvents: async (
    startDate?: string,
    endDate?: string,
    type?: string
  ): Promise<CalendarEvent[]> => {
    try {
      const params: any = {};
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (type) params.type = type;
      
      const response = await apiClient.get<CalendarEventsResponse>('/events', { params });
      
      if (response.data.success) {
        return response.data.data.events;
      }
      
      return [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener eventos de un mes específico
   */
  getMonthEvents: async (year: number, month: number): Promise<CalendarEvent[]> => {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último día del mes
      
      return await calendarService.getEvents(startDate, endDate);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener un evento específico
   */
  getEventById: async (eventId: number): Promise<CalendarEvent> => {
    try {
      const response = await apiClient.get<ApiResponse<CalendarEvent>>(`/events/${eventId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Evento no encontrado');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Crear un nuevo evento
   */
  createEvent: async (eventData: CreateEventRequest): Promise<CalendarEvent> => {
    try {
      const response = await apiClient.post<ApiResponse<CalendarEvent>>('/events', eventData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Error al crear el evento');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Actualizar un evento existente
   */
  updateEvent: async (
    eventId: number,
    eventData: Partial<CreateEventRequest>
  ): Promise<CalendarEvent> => {
    try {
      const response = await apiClient.put<ApiResponse<CalendarEvent>>(
        `/events/${eventId}`,
        eventData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Error al actualizar el evento');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Eliminar un evento
   */
  deleteEvent: async (eventId: number): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(`/events/${eventId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar el evento');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener eventos próximos (siguientes 7 días)
   */
  getUpcomingEvents: async (days: number = 7): Promise<CalendarEvent[]> => {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = futureDate.toISOString().split('T')[0];
      
      return await calendarService.getEvents(startDate, endDate);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener eventos por tipo
   */
  getEventsByType: async (
    type: 'deadline' | 'meeting' | 'presentation' | 'review' | 'other'
  ): Promise<CalendarEvent[]> => {
    try {
      return await calendarService.getEvents(undefined, undefined, type);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Marcar evento como completado (si aplica)
   */
  markEventAsCompleted: async (eventId: number): Promise<CalendarEvent> => {
    try {
      const response = await apiClient.patch<ApiResponse<CalendarEvent>>(
        `/events/${eventId}/complete`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(ERROR_MESSAGES.EVENT_COMPLETE_ERROR);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};