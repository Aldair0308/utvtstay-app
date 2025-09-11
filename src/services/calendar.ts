import apiClient, { handleApiError } from "./api";
import {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventRequest,
  EventsQueryParams,
  ApiResponse,
} from "../interfaces";
import { ERROR_MESSAGES } from "../const/errors";
import { storageService } from "./storage";

export const calendarService = {
  /**
   * Obtener eventos del calendario
   */
  getEvents: async (
    queryParams?: EventsQueryParams
  ): Promise<CalendarEvent[]> => {
    try {
      const userData = await storageService.getUserData();
      if (!userData?.id) {
        throw new Error('User not authenticated');
      }
      
      const requestParams: any = {};

      if (queryParams?.start_date) requestParams.start_date = queryParams.start_date;
      if (queryParams?.end_date) requestParams.end_date = queryParams.end_date;
      if (queryParams?.month) requestParams.month = queryParams.month;
      if (queryParams?.year) requestParams.year = queryParams.year;

      console.log("Requesting events with params:", requestParams);

      const response = await apiClient.get<CalendarEventsResponse>(
        `/public/user/${userData.id}/events`,
        { params: requestParams }
      );
      console.log("Events response:", response.data);

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.events
      ) {
        return response.data.data.events;
      }

      // Si la respuesta no tiene la estructura esperada, devolver array vacío
      console.warn("Unexpected response structure:", response.data);
      return [];
    } catch (error) {
      console.error("Calendar service error:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener eventos de un mes específico
   */
  getMonthEvents: async (
    year: number,
    month: number
  ): Promise<CalendarEvent[]> => {
    try {
      return await calendarService.getEvents({ month, year });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener un evento específico
   */
  getEventById: async (eventId: number): Promise<CalendarEvent> => {
    try {
      const userData = await storageService.getUserData();
      if (!userData?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await apiClient.get<CalendarEventsResponse>(
        `/public/user/${userData.id}/events`
      );

      if (response.data.success && response.data.data && response.data.data.events) {
        const event = response.data.data.events.find(e => e.id === eventId);
        if (event) {
          return event;
        }
      }

      throw new Error(ERROR_MESSAGES.NOT_FOUND);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Crear un nuevo evento
   */
  createEvent: async (
    eventData: CreateEventRequest
  ): Promise<CalendarEvent> => {
    try {
      const response = await apiClient.post<ApiResponse<CalendarEvent>>(
        `/api/events`,
        eventData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(ERROR_MESSAGES.UNEXPECTED_ERROR);
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
        `/api/events/${eventId}`,
        eventData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Error al actualizar el evento");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Eliminar un evento
   */
  deleteEvent: async (eventId: number): Promise<void> => {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/events/${eventId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Error al eliminar el evento");
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
      const userData = await storageService.getUserData();
      if (!userData?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log("Requesting upcoming events for days:", days);

      const response = await apiClient.get<CalendarEventsResponse>(
        `/public/user/${userData.id}/events`
      );
      console.log("Upcoming events response:", response.data);

      if (response.data.success && response.data.data && response.data.data.events) {
        // Filtrar eventos próximos basado en los días especificados
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);
        
        return response.data.data.events.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= now && eventDate <= futureDate;
        });
      }

      // Si la respuesta no tiene la estructura esperada, devolver array vacío
      console.warn(
        "Unexpected upcoming events response structure:",
        response.data
      );
      return [];
    } catch (error) {
      console.error("Upcoming events service error:", error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obtener eventos por tipo
   */
  getEventsByType: async (
    type: "deadline" | "meeting" | "presentation" | "review" | "other"
  ): Promise<CalendarEvent[]> => {
    try {
      const userData = await storageService.getUserData();
      if (!userData?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await apiClient.get<CalendarEventsResponse>(
        `/public/user/${userData.id}/events`
      );

      if (response.data.success && response.data.data && response.data.data.events) {
        // Filtrar eventos por tipo
        return response.data.data.events.filter(event => event.type === type);
      }

      return [];
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
        `/api/events/${eventId}/complete`
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
