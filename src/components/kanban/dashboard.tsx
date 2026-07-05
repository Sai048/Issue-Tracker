import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Sidebar from "../sidebar";
import Loading from "../loading";

import { supabase } from "../supabase-client";

import KanbanBoard from "./KanbanBoard";
import TaskListView from "./TaskListView";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

const Dashboard = () => {
  const { projectId } = useParams();
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const [project, setProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  const [collapsed, setCollapsed] = useState(false);

  // ===========================
  // Fetch Project
  // ===========================

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setProject(data);
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
    fetchProject();
  }, [projectId]);

  // ===========================
  // Loading
  // ===========================

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex flex-1 items-center justify-center lg:ml-64">
          <div className="flex flex-col items-center gap-4">
            <Loading />

            <p className="text-sm text-slate-500">
              Loading project dashboard...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ===========================
  // Project Not Found
  // ===========================

  if (!project) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex flex-1 items-center justify-center lg:ml-64">
          <div
            className="
              flex flex-col items-center rounded-3xl
              border border-slate-200 bg-white
              px-10 py-12 shadow-sm
            "
          >
            <div
              className="
                mb-5 flex h-20 w-20 items-center
                justify-center rounded-full
                bg-slate-100 text-4xl
              "
            >
              📁
            </div>

            <h2 className="text-2xl font-bold text-slate-700">
              Project Not Found
            </h2>

            <p className="mt-2 text-center text-slate-500">
              The requested project does not exist or you don't have access.
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
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main */}
      <main
        className={`
        min-h-screen
        bg-slate-50
        transition-all duration-300
        ml-0
        ${collapsed ? "lg:ml-24" : "lg:ml-64"}
      `}
      >
        {/* HEADER */}
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
              lg:flex-row lg:items-center lg:justify-between
            "
            >
              {/* LEFT */}
              <div className="min-w-0">
                <div className="flex items-start gap-3 sm:items-center">
                  {/* ICON */}
                  <div
                    className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-teal-500 to-cyan-500
                    text-xl text-white shadow-lg
                    sm:h-14 sm:w-14 sm:text-2xl
                  "
                  >
                    📋
                  </div>

                  {/* TITLE */}
                  <div className="min-w-0 flex-1">
                    <h1
                      className="
                      truncate
                      text-2xl font-bold
                      text-slate-800
                      sm:text-3xl
                    "
                    >
                      {project.name}
                    </h1>

                    {/* TAGS */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className="
                        rounded-full
                        bg-teal-100
                        px-3 py-1
                        text-xs font-semibold
                        capitalize
                        text-teal-700
                      "
                      >
                        {project.status}
                      </span>

                      <span
                        className="
                        rounded-full
                        bg-slate-100
                        px-3 py-1
                        text-xs font-medium
                        text-slate-600
                      "
                      >
                        Project Dashboard
                      </span>
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p
                  className="
                  mt-4
                  max-w-4xl
                  text-sm leading-6
                  text-slate-500
                  sm:text-base sm:leading-7
                "
                >
                  {project.description || "No project description available."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW TOGGLES */}
        <div className="mt-5 flex flex-wrap gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setView("kanban")}
            className={`
            rounded-xl px-4 py-2 text-sm font-medium transition
            ${
              view === "kanban"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }
          `}
          >
            Kanban View
          </button>

          <button
            onClick={() => setView("list")}
            className={`
            rounded-xl px-4 py-2 text-sm font-medium transition
            ${
              view === "list"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }
          `}
          >
            List View
          </button>
        </div>

        {/* CONTENT */}
        <div
          className="
          w-full
          overflow-x-hidden
          px-4 py-5
          sm:px-6
          lg:px-8
        "
        >
          {view === "kanban" ? (
            <KanbanBoard projectId={project.id} />
          ) : (
            <TaskListView projectId={project.id} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
