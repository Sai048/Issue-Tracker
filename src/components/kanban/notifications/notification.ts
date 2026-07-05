export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  task_id?: string;
  is_read: boolean;
  created_at: string;
}