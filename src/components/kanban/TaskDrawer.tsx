import { useEffect, useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";

import TaskService from "./service";
import type { Task, Section } from "./task";
import TaskForm from "./TaskForm";
import TaskComments from "./TaskComments";
import TaskAttachments from "./TaskAttachments";
import ConfirmModal from "../modal/modal";
import Loading from "../loading";

interface User {
  id: string;
  full_name: string;
}

interface TaskDrawerProps {
  open: boolean;
  taskId: string | null;
  projectId: string;

  users: User[];
  sections: Section[];

  onClose: () => void;
  onRefresh: () => void;
}

const TaskDrawer = ({
  open,
  taskId,
  projectId,
  users,
  sections,
  onClose,
  onRefresh,
}: TaskDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

  const [editMode, setEditMode] = useState(false);

  // ===========================
  // Load Task
  // ===========================

  const loadTask = async () => {
    try {
      setLoading(true);

      const data = await TaskService.getTask(taskId!);

      setTask(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !taskId) return;

    loadTask();
  }, [open, taskId]);

  // ===========================
  // Delete Task
  // ===========================

  const handleDelete = async () => {
    if (!task) return;

    try {
      setDeleting(true);

      await TaskService.deleteTask(task.id);

      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Unable to delete task.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const statusStyles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    review: "bg-purple-100 text-purple-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    todo: "bg-slate-100 text-slate-700",
  };

  const priorityStyles: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-blue-100 text-blue-700",
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm h-screen">
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-hidden bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Task Details
            </h2>

            <p className="text-sm text-slate-500">
              View and manage task information
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100  cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto">
          {/* Loading */}
          {loading && <Loading />}

          {/* Edit Form */}
          {!loading && editMode && task && (
            <div className="p-4 sm:p-6">
              <TaskForm
                projectId={projectId}
                task={task}
                users={users}
                sections={sections}
                onClose={() => setEditMode(false)}
                onSuccess={() => {
                  loadTask();
                  onRefresh();
                  setEditMode(false);
                }}
              />
            </div>
          )}

          {/* Details */}
          {!loading && !editMode && task && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Title */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h1 className="break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                  {task.title}
                </h1>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Status</p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-medium ${
                      statusStyles[task.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Priority</p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-medium ${
                      priorityStyles[task.priority]
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Assignee & Section */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-medium text-slate-500">
                    Assignee
                  </h3>

                  <p className="mt-3 text-base font-semibold text-slate-700">
                    {users.find((u) => u.id === task.assigned_to)?.full_name ||
                      "Unassigned"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-medium text-slate-500">
                    Section
                  </h3>

                  <p className="mt-3 text-base font-semibold text-slate-700">
                    {sections.find((s) => s.id === task.section_id)?.name ||
                      "-"}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Start Date</p>

                  <p className="mt-3 font-medium text-slate-700">
                    {task.start_date
                      ? new Date(task.start_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">End Date</p>

                  <p className="mt-3 font-medium text-slate-700">
                    {task.end_date
                      ? new Date(task.end_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Due Date */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Due Date</p>

                <p className="mt-3 font-medium text-slate-700">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {/* Story Points & Estimated Hours */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Story Points</p>

                  <p className="mt-3 text-2xl font-bold text-slate-800">
                    {task.story_points || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Estimated Hours</p>

                  <p className="mt-3 text-2xl font-bold text-slate-800">
                    {task.estimated_hours || 0}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Created At</p>

                <p className="mt-3 font-medium text-slate-700">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>

              {/* Future Sections */}
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  {taskId && <TaskComments taskId={taskId} />}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  {taskId && <TaskAttachments taskId={taskId} />}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Activity
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Activity history will appear here.
                  </p>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-20" />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !editMode && task && (
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-white p-4 shadow-lg">
            <button
              onClick={() => setEditMode(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 sm:flex-none cursor-pointer"
            >
              <Pencil size={18} />
              Edit
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 sm:flex-none  cursor-pointer"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>
      {/* Delete Modal */}

      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="bg-red-600 hover:bg-red-700"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default TaskDrawer;
