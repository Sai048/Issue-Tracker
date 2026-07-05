import { supabase } from "../../../components/supabase-client";

export class NotificationService {
  static async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createNotification(payload: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    task_id?: string;
  }) {
    const { error } = await supabase
      .from("notifications")
      .insert(payload);

    if (error) throw error;
  }

  static async markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw error;
  }

  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) throw error;
  }
}