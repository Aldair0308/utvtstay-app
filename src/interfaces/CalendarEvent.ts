export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  type: 'deadline' | 'meeting' | 'presentation' | 'review' | 'other';
  priority: 'low' | 'medium' | 'high';
  student_id: number;
  created_at: string;
  updated_at: string;
  is_all_day: boolean;
  location?: string;
  reminder_minutes?: number;
}

export interface CalendarEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    total: number;
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  type: 'deadline' | 'meeting' | 'presentation' | 'review' | 'other';
  priority: 'low' | 'medium' | 'high';
  is_all_day: boolean;
  location?: string;
  reminder_minutes?: number;
}