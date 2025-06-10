export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;       // ISO string
  priority: 'low' | 'medium' | 'high';
  created_at: string;      // ISO string
  updated_at: string;      // ISO string
  owner_id: string;        // UUID
}

// Additional types for API responses
export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface DeleteTaskResponse {
  deletedTaskId: number;
}