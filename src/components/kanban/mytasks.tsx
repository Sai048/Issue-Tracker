// src/pages/tasks/MyTasks.tsx

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  Search,
  AlertTriangle,
} from "lucide-react";

import Sidebar from "../sidebar";
import Loading from "../loading";

import { supabase } from "../supabase-client";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  position: number;

  sections?: {
    id: string;
    name: string;
    position: number;
  };

  projects?: {
    id: string;
    name: string;
  };
}

const MyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);

  const [collapsed, setCollapsed] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  // ===========================
  // Fetch My Tasks
  // ===========================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          sections (
            id,
            name,
            position
          ),
          projects (
            id,
            name
          )
        `)
        .eq("assigned_to", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const sortedTasks = (data || []).sort((a, b) => {
        const sectionA = a.sections?.position ?? 0;
        const sectionB = b.sections?.position ?? 0;

        if (sectionA !== sectionB) {
          return sectionA - sectionB;
        }

        return a.position - b.position;
      });

      setTasks(sortedTasks as Task[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Initial Load
  // ===========================

  useEffect(() => {
    fetchTasks();
  }, []);

  // ===========================
  // Filtered Tasks
  // ===========================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  // ===========================
  // Stats
  // ===========================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date) return false;

    return (
      new Date(task.due_date) < new Date() &&
      task.status !== "completed"
    );
  }).length;

  // ===========================
  // Loading
  // ===========================

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main
          className={`
            flex flex-1 items-center justify-center
            ${collapsed ? "lg:ml-24" : "lg:ml-64"}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <Loading />

            <p className="text-sm text-slate-500">
              Loading your tasks...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ===========================
  // JSX
  // ===========================

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main */}
      <main
        className={`
          h-screen overflow-hidden
          bg-slate-50 transition-all duration-300
          ${collapsed ? "lg:ml-24" : "lg:ml-64"}
        `}
      >
        {/* Header */}
        <div
          className="
            sticky top-0 z-30
            border-b border-slate-200
            bg-white/90 backdrop-blur
          "
        >
          <div className="px-4 py-5 sm:px-6 lg:px-8">
            <div
              className="
                flex flex-col gap-5
                lg:flex-row lg:items-center
                lg:justify-between
              "
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-12 w-12 items-center
                      justify-center rounded-2xl
                      bg-gradient-to-br
                      from-indigo-500 to-purple-500
                      text-white shadow-lg
                    "
                  >
                    📌
                  </div>

                  <div>
                    <h1
                      className="
                        text-2xl font-bold
                        text-slate-800 sm:text-3xl
                      "
                    >
                      My Tasks
                    </h1>

                    <p className="mt-1 text-slate-500">
                      Manage your assigned tasks efficiently
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div
                className="
                  flex w-full items-center gap-3
                  lg:max-w-md
                "
              >
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="
                      absolute left-3 top-1/2
                      -translate-y-1/2 text-slate-400
                    "
                  />

                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                      w-full rounded-2xl
                      border border-slate-200
                      bg-white py-3 pl-10 pr-4
                      text-sm outline-none
                      transition
                      focus:border-teal-500
                      focus:ring-4 focus:ring-teal-100
                    "
                  />
                </div>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="
                    rounded-2xl border border-slate-200
                    bg-white px-4 py-3 text-sm
                    outline-none
                  "
                >
                  <option value="all">All</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">
                    In Progress
                  </option>
                  <option value="review">Review</option>
                  <option value="completed">
                    Completed
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="
            h-[calc(100vh-120px)]
            overflow-y-auto
            px-4 py-6
            sm:px-6
            lg:px-8
          "
        >
          {/* Stats */}
          <div
            className="
              grid grid-cols-1 gap-5
              sm:grid-cols-2 xl:grid-cols-4
            "
          >
            {/* Total */}
            <div
              className="
                rounded-3xl border border-slate-200
                bg-white p-6 shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-slate-500">
                    Total Tasks
                  </h3>

                  <p
                    className="
                      mt-3 text-4xl font-bold
                      text-slate-800
                    "
                  >
                    {totalTasks}
                  </p>
                </div>

                <FolderKanban className="text-slate-400" />
              </div>
            </div>

            {/* Completed */}
            <div
              className="
                rounded-3xl border border-slate-200
                bg-white p-6 shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-slate-500">
                    Completed
                  </h3>

                  <p
                    className="
                      mt-3 text-4xl font-bold
                      text-green-600
                    "
                  >
                    {completedTasks}
                  </p>
                </div>

                <CheckCircle2 className="text-green-500" />
              </div>
            </div>

            {/* In Progress */}
            <div
              className="
                rounded-3xl border border-slate-200
                bg-white p-6 shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-slate-500">
                    In Progress
                  </h3>

                  <p
                    className="
                      mt-3 text-4xl font-bold
                      text-orange-500
                    "
                  >
                    {inProgressTasks}
                  </p>
                </div>

                <Clock3 className="text-orange-500" />
              </div>
            </div>

            {/* Overdue */}
            <div
              className="
                rounded-3xl border border-slate-200
                bg-white p-6 shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-slate-500">
                    Overdue
                  </h3>

                  <p
                    className="
                      mt-3 text-4xl font-bold
                      text-red-500
                    "
                  >
                    {overdueTasks}
                  </p>
                </div>

                <AlertTriangle className="text-red-500" />
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div
            className="
              mt-6 overflow-hidden
              rounded-3xl border
              border-slate-200 bg-white
              shadow-sm
            "
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead
                  className="
                    border-b border-slate-200
                    bg-slate-50
                  "
                >
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Task
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Project
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Section
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Priority
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Due Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="
                        border-b border-slate-100
                        transition hover:bg-slate-50
                      "
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {task.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {task.description ||
                              "No description"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {task.projects?.name || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {task.sections?.name || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            rounded-full bg-slate-100
                            px-3 py-1 text-xs
                            font-semibold capitalize
                            text-slate-700
                          "
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-slate-600">
                        {task.priority || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {task.due_date || "-"}
                      </td>
                    </tr>
                  ))}

                  {filteredTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-5xl">📭</div>

                          <h3
                            className="
                              mt-4 text-lg
                              font-semibold text-slate-700
                            "
                          >
                            No Tasks Found
                          </h3>

                          <p className="mt-2 text-slate-500">
                            No tasks match your current filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyTasks;