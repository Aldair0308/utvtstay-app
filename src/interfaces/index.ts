// User interfaces
export type {
  User,
  AuthContextType,
  LoginResponse,
} from './User';

// File interfaces
export type {
  File,
  FileHistory,
  FileVersion,
  FileListResponse,
  FileDetailResponse,
} from './File';

// Calendar interfaces
export type {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventRequest,
} from './CalendarEvent';

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Files: undefined;
  FileDetail: { fileId: number };
  FileHistory: { fileId: number };
  FileEdit: { fileId: number };
  Calendar: undefined;
  Profile: undefined;
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}