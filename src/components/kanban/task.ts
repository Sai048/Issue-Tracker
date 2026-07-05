// src/types/task.ts

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "review" | "completed";

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
}

export interface Section {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at?: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
  label?: Label;
}

export interface Attachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at?: string;

  user?: UserProfile;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;

  user?: UserProfile;
}

export interface Task {
  id: string;

  project_id: string;

  section_id: string;

  title: string;

  description: string;

  status: TaskStatus;

  position: number;

  priority: TaskPriority;

  assigned_to: string | null;

  reporter: string | null;

  created_by: string | null;

  updated_by: string | null;

  start_date: string | null;

  end_date: string | null;

  due_date: string | null;

  story_points: number;

  estimated_hours: number;

  archived: boolean;

  completed_at: string | null;

  created_at: string;

  // ADD THIS
  sections?: Section;
}

export interface CreateTaskRequest {
  project_id: string;

  section_id: string;

  position?: number;

  title: string;

  description: string;

  status?: TaskStatus;

  priority?: TaskPriority;

  assigned_to?: string | null;

  reporter?: string | null;

  start_date?: string | null;

  end_date?: string | null;

  due_date?: string | null;

  story_points?: number;

  estimated_hours?: number;
}

export interface UpdateTaskRequest {
  title?: string;

  description?: string;

  section_id?: string;

  status?: TaskStatus;

  priority?: TaskPriority;

  assigned_to?: string | null;

  reporter?: string | null;

  start_date?: string | null;

  end_date?: string | null;

  due_date?: string | null;

  story_points?: number;

  estimated_hours?: number;

  updated_by?: string | null;
}

export interface TaskFormProps {
  projectId: string;

  task?: Task | null;

  sections: Section[];

  users: UserProfile[];

  onSuccess: () => void;

  onClose: () => void;
}

export interface TaskCardProps {
  task: Task;

  onClick: (task: Task) => void;
}

export interface KanbanColumnProps {
  section: Section;

  tasks: Task[];

  onTaskClick: (task: Task) => void;
}

export interface KanbanBoardProps {
  sections: Section[];

  tasks: Task[];

  onTaskClick: (task: Task) => void;

  onDragEnd: (result: unknown) => void;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;

  profiles?: {
    id: string;
    full_name: string;
  };
}


