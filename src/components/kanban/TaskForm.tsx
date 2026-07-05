import { useEffect, useState } from "react";
import { supabase } from "../../components/supabase-client";
import TaskService from "./service";

import type { Task, TaskPriority, TaskStatus, Section } from "./task";

interface User {
  id: string;
  full_name: string;
}

interface TaskFormProps {
  projectId: string;
  task: Task | null;
  users: User[];
  sections: Section[];
  defaultSectionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TaskForm = ({
  projectId,
  task,
  users,
  defaultSectionId,
  onSuccess,
  onClose,
}: TaskFormProps) => {
  const isEdit = !!task;

  const [loading, setLoading] = useState(false);
  const [sectionId, setSectionId] = useState(defaultSectionId || "");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [assignedTo, setAssignedTo] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("medium");

  const [status, setStatus] = useState<TaskStatus>("todo");

  const [storyPoints, setStoryPoints] = useState(0);

  const [estimatedHours, setEstimatedHours] = useState(0);

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [dueDate, setDueDate] = useState("");

  const [createdBy, setCreatedBy] = useState("");

  const [errors, setErrors] = useState({
    title: "",
  });

  // Modal
  const [modal, setModal] = useState({
    open: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Get logged in user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCreatedBy(user.id);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    setSectionId(defaultSectionId || "");
  }, [defaultSectionId]);

  // Load task data
  useEffect(() => {
    if (!task) {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("medium");
      setStatus("todo");
      setStoryPoints(0);
      setEstimatedHours(0);
      setStartDate("");
      setEndDate("");
      setDueDate("");

      return;
    }

    setTitle(task.title || "");

    setDescription(task.description || "");

    setAssignedTo(task.assigned_to || "");

    setPriority(task.priority || "medium");

    setStatus(task.status || "todo");

    setStoryPoints(task.story_points || 0);

    setEstimatedHours(Number(task.estimated_hours || 0));

    setStartDate(task.start_date?.substring(0, 10) || "");

    setEndDate(task.end_date?.substring(0, 10) || "");

    setDueDate(task.due_date?.substring(0, 10) || "");
  }, [task]);

  const validate = () => {
    let valid = true;

    const newErrors = {
      title: "",
    };

    if (!title.trim()) {
      newErrors.title = "Title is required";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  const showModal = (type: "success" | "error", message: string) => {
    setModal({
      open: true,
      type,
      message,
    });

    setTimeout(() => {
      setModal((prev) => ({
        ...prev,
        open: false,
      }));
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        project_id: projectId,
        section_id: sectionId,

        title,
        description,
        assigned_to: assignedTo || null,
        priority,
        status,
        story_points: storyPoints,
        estimated_hours: estimatedHours,
        start_date: startDate || null,
        end_date: endDate || null,
        due_date: dueDate || null,
        created_by: createdBy,
      };

      console.log("Submitting payload:", payload);

      if (isEdit && task?.id) {
        await TaskService.updateTask(task.id, {
          title,

          description,

          assigned_to: assignedTo || null,

          priority,

          status,

          story_points: storyPoints,

          estimated_hours: estimatedHours,

          start_date: startDate || null,

          end_date: endDate || null,

          due_date: dueDate || null,
        });

        showModal("success", "Task updated successfully");
      } else {
        await TaskService.createTask(payload);

        showModal("success", "Task created successfully");
      }

      onSuccess();

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error(error);

      showModal("error", "Unable to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MODAL */}
      {modal.open && (
        <div className="fixed top-5 right-5 z-[9999]">
          <div
            className={`
              min-w-[260px]
              rounded-xl
              px-5 py-4
              shadow-2xl
              text-white
              ${modal.type === "success" ? "bg-green-600" : "bg-red-600"}
            `}
          >
            <p className="font-medium">{modal.message}</p>
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="w-full max-w-3xl mx-auto max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Task" : "Create Task"}
          </h2>

          <p className="text-sm text-gray-500">
            Fill in the details below to {isEdit ? "update" : "create"} task
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* TITLE */}
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>

            <input
              className="
                mt-1
                w-full
                rounded-lg
                border border-gray-300
                p-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />

            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              rows={4}
              className="
                mt-1
                w-full
                rounded-lg
                border border-gray-300
                p-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write task details..."
            />
          </div>

          {/* ASSIGNEE + PRIORITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ASSIGNEE */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Assignee
              </label>

              <select
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                  focus:ring-2
                  focus:ring-blue-500
                "
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* PRIORITY */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                  focus:ring-2
                  focus:ring-blue-500
                "
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>

                <option value="medium">Medium</option>

                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>

            <select
              className="
                mt-1
                w-full
                rounded-lg
                border border-gray-300
                p-3
                focus:ring-2
                focus:ring-blue-500
              "
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">Todo</option>

              <option value="in_progress">In Progress</option>

              <option value="review">Review</option>

              <option value="completed">Completed</option>
            </select>
          </div>

          {/* NUMBERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Story Points
              </label>

              <input
                type="number"
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                  focus:ring-2
                  focus:ring-blue-500
                "
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Estimated Hours
              </label>

              <input
                type="number"
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                  focus:ring-2
                  focus:ring-blue-500
                "
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
              />
            </div>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                "
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                "
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Due Date
              </label>

              <input
                type="date"
                className="
                  mt-1
                  w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                "
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t bg-white px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="
              w-full sm:w-auto
              px-5 py-2
              rounded-lg
              border
              hover:bg-gray-100
              transition
              cursor-pointer
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              w-full sm:w-auto
              px-6 py-2
              rounded-lg
              bg-blue-600
              text-white
              hover:bg-blue-700
              transition
              disabled:opacity-60
              cursor-pointer
            "
          >
            {loading ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskForm;
