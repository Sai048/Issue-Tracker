import {  useEffect, useState } from "react";
import { supabase } from "../../../components/supabase-client";
import { useNotifications } from "./notifications";
import { NotificationService } from "./notification.sevice";
import Sidebar from "../../../components/sidebar"

const Notifications = () => {
  const [collapsed, setCollapsed] = useState(false);

  const [userId, setUserId] = useState("");

  // =========================
  // FETCH CURRENT USER
  // =========================
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id || "");
    };

    getUser();
  }, []);

  // =========================
  // NOTIFICATIONS
  // =========================
  const { notifications, loading, refetch } =
    useNotifications(userId);

  // =========================
  // MARK AS READ
  // =========================
  const handleRead = async (id: string) => {
    await NotificationService.markAsRead(id);

    refetch();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* =========================
          SIDEBAR
      ========================= */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        className={`
          flex-1 transition-all duration-300
          ${
            collapsed
              ? "md:ml-20"
              : "md:ml-64"
          }
        `}
      >
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          {/* =========================
              HEADER
          ========================= */}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View all your task activities and alerts
              </p>
            </div>

            {/* Unread Count */}
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">
                Unread Notifications
              </p>

              <h2 className="text-xl font-bold text-teal-600">
                {
                  notifications.filter((n) => !n.is_read)
                    .length
                }
              </h2>
            </div>
          </div>

          {/* =========================
              CONTENT
          ========================= */}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-700">
                No notifications found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You're all caught up 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  className={`
                    cursor-pointer rounded-2xl border p-4 sm:p-5
                    transition-all duration-200 hover:shadow-md
                    ${
                      !n.is_read
                        ? "border-teal-200 bg-teal-50"
                        : "border-slate-200 bg-white"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Dot */}

                    {!n.is_read && (
                      <div className="mt-2 h-3 w-3 flex-shrink-0 rounded-full bg-teal-500" />
                    )}

                    {/* Content */}

                    <div className="flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">
                            {n.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                            {n.message}
                          </p>
                        </div>

                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(
                            n.created_at,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
