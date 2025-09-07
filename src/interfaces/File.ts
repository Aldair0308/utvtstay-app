export interface File {
  id: string;
  name: string;
  content: string;
  description?: string;
  version: number;
  status: 'active' | 'inactive' | 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  studentId: number;
  tutorObservations?: string;
  mimeType: string;
  fileType: string;
  size: number;
}

export interface FileHistory {
  id: number;
  file_id: number;
  version: number;
  content: string;
  changes_description: string;
  created_at: string;
  created_by: number;
}

export interface FileVersion {
  id: number;
  version: number;
  content: string;
  created_at: string;
  changes: string;
}

export interface FileListResponse {
  success: boolean;
  data: {
    files: File[];
    total: number;
    current_page: number;
    per_page: number;
  };
}

export interface FileDetailResponse {
  success: boolean;
  data: {
    file: File;
  };
}