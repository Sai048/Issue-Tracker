import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { NotificationService } from "./notification.sevice";
import type { Notification } from "./notification";

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH
  // =========================
  const fetchNotifications = async () => {
    if (!userId) return;

    setLoading(true);

    const data = await NotificationService.getNotifications(userId);

    setNotifications(data || []);

    setLoading(false);
  };

  // =========================
  // EFFECT
  // =========================
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // =========================
    // REALTIME CHANNEL
    // =========================
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // 🔥 prevent duplicates
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id);
            if (exists) return prev;

            return [newNotification, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // =========================
  // RETURN
  // =========================
  return {
    notifications,
    loading,
    refetch: fetchNotifications,
  };
};
