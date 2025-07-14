export type ProjectStatusHistoryEntry = {
  id: string
  date: string
  oldStatus: string
  newStatus: string
  userId: string
  userName: string
}

export type RecurrencePattern = {
  type: string
  interval?: number
  daysOfWeek?: string[]
  dayOfMonth?: number
  monthOfYear?: number
}

export type VersionHistoryEntry = {
  id: string
  projectId: string
  changedFields: string[]
  previousValues: Record<string, any>
  changedBy: string
  timestamp: string
  createdAt: string
}

export interface ProjectDocument {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  skills?: string[];
}

export interface ProjectActivity {
  id: string;
  type: 'created' | 'updated' | 'status_changed' | 'document_uploaded' | 'team_member_added' | 'team_member_removed';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  end_date?: string;
  estimated_budget?: number;
  actual_budget?: number;
  performance_points?: number;
  manager?: string;
  type?: string;
  progress?: number;
  team_members?: TeamMember[];
  assigned_team_ids?: string[];
  documents?: ProjectDocument[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  last_activity?: string;
  activities?: ProjectActivity[];
  recurrence_pattern?: RecurrencePattern;
  version_history?: VersionHistoryEntry[];
}
