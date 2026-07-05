import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "./notifications";
import { NotificationService } from "./notification.sevice";

interface Props {
  userId: string;
}

const NotificationBell = ({ userId }: Props) => {
  const { notifications, refetch } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // =========================
  // Mark as read
  // =========================
  const handleRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    await refetch(); // 🔥 refresh UI
  };

  // =========================
  // Close on outside click
  // =========================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-100"
      >
        <Bell />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl border max-h-96 overflow-y-auto z-50"
        >
          {/* Header */}
          <div className="p-3 border-b font-semibold">
            Notifications
          </div>

          {/* Empty */}
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRead(n.id)}
                className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${
                  !n.is_read ? "bg-slate-50" : ""
                }`}
              >
                <div className="font-medium text-sm">
                  {n.title}
                </div>
                <div className="text-xs text-gray-500">
                  {n.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;