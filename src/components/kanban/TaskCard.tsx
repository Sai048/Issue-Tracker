import { Calendar, Clock, User, UserPlus } from "lucide-react";
import type { Task } from "./task";
import { supabase } from "../supabase-client";
import { useEffect, useState } from "react";

interface UserType {
  id: string;
  full_name: string;
}

interface TaskCardProps {
  task: Task;
  users: UserType[];
  onClick: (taskId: string) => void;
  isDragging?: boolean;
}

interface Profile {
  id: string;
  full_name: string;
}

const priorityColor = {
  low: "bg-blue-100 text-blue-700 border border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  high: "bg-red-100 text-red-700 border border-red-200",
};

const statusColor = {
  todo: "bg-slate-100 text-slate-700 border border-slate-200",
  in_progress: "bg-orange-100 text-orange-700 border border-orange-200",
  review: "bg-purple-100 text-purple-700 border border-purple-200",
  completed: "bg-green-100 text-green-700 border border-green-200",
};

const TaskCard = ({
  task,
  users,
  onClick,
  isDragging = false,
}: TaskCardProps) => {
  const [createdByUser, setCreatedByUser] = useState<Profile | null>(null);
  const assignee = users.find((user) => user.id === task.assigned_to);

  const getCreatedUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setCreatedByUser(data);
  };

  useEffect(() => {
    if (task.created_by) {
      getCreatedUser(task.created_by);
    }
  }, []);

  return (
    <div
      onClick={() => {
        if (!isDragging) {
          onClick(task.id);
        }
      }}
      className={`
        group
        cursor-pointer
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        ${isDragging ? "rotate-2 shadow-2xl opacity-80" : ""}
      `}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className="
            line-clamp-2
            flex-1
            break-words
            text-base
            font-semibold
            text-slate-800
            sm:text-lg
          "
        >
          {task.title}
        </h3>

        <span
          className={`
            shrink-0
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
            capitalize
            ${priorityColor[task.priority]}
          `}
        >
          {task.priority}
        </span>
      </div>

      {/* DESCRIPTION */}
      <p
        className="
          mt-3
          line-clamp-3
          min-h-[60px]
          text-sm
          leading-6
          text-slate-500
        "
      >
        {task.description || "No description provided."}
      </p>

      {/* STATUS */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`
            rounded-full
            px-3
            py-1
            text-xs
            font-medium
            capitalize
            ${statusColor[task.status]}
          `}
        >
          {task.status.replace("_", " ")}
        </span>

        {task.story_points ? (
          <span className="text-xs font-medium text-slate-400">
            {task.story_points} SP
          </span>
        ) : null}
      </div>

      {/* DATES */}
      <div className="mt-5 space-y-3 text-sm text-slate-500">
        {task.start_date && (
          <div className="flex items-center gap-2">
            <Calendar size={15} className="shrink-0 text-slate-400" />

            <span className="truncate">
              {new Date(task.start_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {task.due_date && (
          <div className="flex items-center gap-2">
            <Clock size={15} className="shrink-0 text-slate-400" />

            <span className="truncate">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* CREATED BY */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-indigo-100
            "
          >
            <UserPlus size={15} className="text-indigo-600" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {createdByUser?.full_name || "Unknown"}
            </p>

            <p className="text-xs text-slate-400">Created By</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        className="
          mt-5
          flex
          flex-col
          gap-4
          border-t
          border-slate-100
          pt-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* ASSIGNEE */}
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-slate-100
            "
          >
            <User size={15} className="text-slate-600" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {assignee?.full_name || "Unassigned"}
            </p>

            <p className="text-xs text-slate-400">Assignee</p>
          </div>
        </div>

        {/* STATS */}
        <div className="flex flex-wrap gap-2">
          <span
            className="
              rounded-lg
              bg-slate-100
              px-3
              py-1
              text-xs
              font-medium
              text-slate-700
            "
          >
            {task.story_points || 0} SP
          </span>

          <span
            className="
              rounded-lg
              bg-slate-100
              px-3
              py-1
              text-xs
              font-medium
              text-slate-700
            "
          >
            {task.estimated_hours || 0}h
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
