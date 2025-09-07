export interface File {
  id: number;
  name: string;
  content: string;
  version: number;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  student_id: number;
  tutor_observations?: string;
  file_type: string;
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