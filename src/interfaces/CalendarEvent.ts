export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  type: 'deadline' | 'meeting' | 'reminder' | 'personal';
  priority: 'low' | 'medium' | 'high';
  color: string;
  created_at: string;
  updated_at: string;
  tutor?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CalendarEventsResponse {
  success: boolean;
  message: string;
  data: {
    events: CalendarEvent[];
  };
}

export interface EventsQueryParams {
  start_date?: string;
  end_date?: string;
  month?: number;
  year?: number;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  type: 'deadline' | 'meeting' | 'reminder' | 'personal';
  priority: 'low' | 'medium' | 'high';
  color: string;
}