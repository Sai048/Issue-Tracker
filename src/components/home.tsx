import { useEffect, useState } from "react";
import { FolderKanban, FolderPlus, X, Trash2 } from "lucide-react";
import Sidebar from "./sidebar";
import { supabase } from "./supabase-client";
import Loading from "./loading";
import ConfirmModal from "./modal/modal";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  project_teams: {
    teams: {
      id: string;
      name: string;
    };
  }[];
}

interface Team {
  id: string;
  name: string;
}

const HomePage = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Teams
  const [teams, setTeams] = useState<Team[]>([]);

  // Popup
  const [openModal, setOpenModal] = useState(false);

  // Delete Popup
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Multi Select Teams
  const [selectedTeamsIds, setSelectedTeamsIds] = useState<string[]>([]);

  const canCreateProject = role === "admin" || role === "manager";
  const [collapsed, setCollapsed] = useState(false);

  // =========================
  // Get Current User Role
  // =========================
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setRole(data.role);
    }

    setLoading(false);
  };

  // =========================
  // Fetch Teams
  // =========================
  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
  };

  // =========================
  // Fetch Projects
  // =========================
  const fetchProjects = async () => {
    setProjectsLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select(
        `
  id,
  name,
  description,
  status,
  project_teams (
    team_id,
    teams:team_id (
      id,
      name
    )
  )
`,
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data as unknown as Project[]);
    }

    setProjectsLoading(false);
  };

  // =========================
  // Handle Team Select
  // =========================
  const handleTeamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );

    setSelectedTeamsIds(values);
  };

  // =========================
  // Open Delete Modal
  // =========================
  const openDeleteModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDeleteModal(true);
  };

  // =========================
  // Create Project
  // =========================
  const createProject = async () => {
    if (!projectName.trim()) return;

    if (selectedTeamsIds.length === 0) {
      alert("Select at least one team");
      return;
    }

    const key =
      projectName.replace(/\s+/g, "").substring(0, 3).toUpperCase() +
      Math.floor(Math.random() * 1000);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Step 1: Create ONE project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        description: projectDescription,
        key,
        status: "Active",
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error(projectError);
      return;
    }

    // Step 2: Assign multiple teams
    const projectTeams = selectedTeamsIds.map((teamId) => ({
      project_id: project.id,
      team_id: teamId,
    }));

    const { error: teamError } = await supabase
      .from("project_teams")
      .insert(projectTeams);

    if (teamError) {
      console.error(teamError);
      return;
    }

    resetForm();

    fetchProjects();
  };

  const openEditModal = async (projectId: string) => {
    setEditingProjectId(projectId);

    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", projectId)
      .single();

    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description);
    }

    const { data: assignedTeams } = await supabase
      .from("project_teams")
      .select("team_id")
      .eq("project_id", projectId);

    if (assignedTeams) {
      setSelectedTeamsIds(assignedTeams.map((t) => t.team_id));
    }

    setOpenModal(true);
  };

  const updateProject = async () => {
    if (!editingProjectId) return;

    if (selectedTeamsIds.length === 0) {
      alert("Select at least one team");
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update({
        name: projectName,
        description: projectDescription,
      })
      .eq("id", editingProjectId);

    if (error) {
      console.error(error);
      return;
    }

    const { error: relationError } = await supabase
      .from("project_teams")
      .delete()
      .eq("project_id", editingProjectId);

    if (relationError) {
      console.error(relationError);
      setDeleteLoading(false);
      return;
    }

    const payload = selectedTeamsIds.map((teamId) => ({
      project_id: editingProjectId,
      team_id: teamId,
    }));

    const { error: insertError } = await supabase
      .from("project_teams")
      .insert(payload);

    if (insertError) {
      console.error(insertError);
      return;
    }

    resetForm();

    fetchProjects();
  };

  // =========================
  // Delete Project
  // =========================
  const deleteProject = async () => {
    if (!selectedProjectId) return;

    setDeleteLoading(true);

    const { error: deleteError } = await supabase
      .from("project_teams")
      .delete()
      .eq("project_id", selectedProjectId);

    if (deleteError) {
      console.error(deleteError);
      return;
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", selectedProjectId);

    if (error) {
      console.error(error);
      setDeleteLoading(false);
      return;
    }

    if (deleteError) {
      console.error(deleteError);
      setDeleteLoading(false);
      return;
    }

    setDeleteModal(false);
    setSelectedProjectId(null);
    setDeleteLoading(false);

    fetchProjects();
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    getCurrentUser();
    fetchProjects();
    fetchTeams();
  }, []);

  const handleDAshboard = (projectId: string) => {
    navigate(`/dashboard/${projectId}`);
  };

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setSelectedTeamsIds([]);
    setEditingProjectId(null);
    setOpenModal(false);
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-xl">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* Main */}
      <main
        className={`
    min-h-screen flex-1
    bg-slate-50
    transition-all duration-300

    px-4 py-20
    sm:px-6
    lg:px-8 lg:py-8

    ${collapsed ? "lg:ml-24" : "lg:ml-64"}
  `}
      >
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">
              Welcome 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage your projects and track issues.
            </p>
          </div>

          {/* Create Project */}
          {canCreateProject && (
            <button
              onClick={() => {
                resetForm();
                setOpenModal(true);
              }}
              className="
          flex items-center justify-center gap-2
          rounded-xl bg-teal-500 px-5 py-3
          text-sm font-medium text-white
          shadow-md transition hover:bg-teal-600 cursor-pointer
          w-full sm:w-auto
        "
            >
              <FolderPlus size={20} />
              Create Project
            </button>
          )}
        </div>

        {/* Projects */}
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-semibold text-slate-800">
            Projects
          </h2>

          {projectsLoading ? (
            <div className="flex justify-center py-10">
              <Loading />
            </div>
          ) : projects.length === 0 ? (
            <div
              className="
          rounded-2xl border border-slate-200
          bg-white p-10 text-center shadow-sm
        "
            >
              <FolderKanban size={50} className="mx-auto text-slate-300" />

              <h2 className="mt-4 text-2xl font-bold text-slate-700">
                No Projects Found
              </h2>

              <p className="mt-2 text-slate-500">Create your first project.</p>
            </div>
          ) : (
            <div
              className="
          grid gap-6
          sm:grid-cols-2
          xl:grid-cols-3
        "
            >
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="
              rounded-3xl border border-slate-200
              bg-white p-5 shadow-sm
              transition hover:-translate-y-1
              hover:shadow-xl
            "
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                      <FolderKanban className="text-teal-600" size={28} />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className={`
                    rounded-full px-3 py-1
                    text-xs font-medium

                    ${
                      project.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                      >
                        {project.status}
                      </span>

                      <button
                        onClick={() => openEditModal(project.id)}
                        className="
                    rounded-xl bg-blue-50 p-2
                    text-blue-500 transition
                    hover:bg-blue-100 cursor-pointer
                  "
                      >
                        Edit
                      </button>

                      {canCreateProject && (
                        <button
                          onClick={() => openDeleteModal(project.id)}
                          className="
                      rounded-xl bg-red-50 p-2
                      text-red-500 transition
                      hover:bg-red-100 cursor-pointer
                    "
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="mt-5 text-2xl font-bold text-slate-800">
                    {project.name}
                  </h3>

                  {/* Teams */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.project_teams?.map((item) => (
                      <span
                        key={item.teams.id}
                        className="
                    rounded-full bg-blue-100
                    px-3 py-1 text-xs
                    font-medium text-blue-700
                  "
                      >
                        {item.teams.name}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="mt-3 line-clamp-3 text-sm text-slate-500">
                    {project.description || "No description"}
                  </p>

                  {/* Button */}
                  <button
                    className="
                mt-6 w-full rounded-xl
                bg-slate-900 py-3 text-white
                transition hover:bg-slate-800 cursor-pointer
              "
                    onClick={() => handleDAshboard(project.id)}
                  >
                    View Project
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* ========================= */}
      {/* Create Project Modal */}
      {/* ========================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between ">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingProjectId ? "Edit Project" : "Create Project"}
              </h2>

              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="mt-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name
                </label>

                <input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  placeholder="Enter description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Teams Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Teams
                </label>

                <select
                  multiple
                  value={selectedTeamsIds}
                  onChange={handleTeamSelect}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[140px]"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-slate-500 mt-2">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple teams.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={editingProjectId ? updateProject : createProject}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-3 rounded-xl transition cursor-pointer"
                >
                  {editingProjectId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================= */}
      {/* Delete Modal */}
      {/* ========================= */}
      <ConfirmModal
        isOpen={deleteModal}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        loading={deleteLoading}
        onConfirm={deleteProject}
        onCancel={() => {
          setDeleteModal(false);
          setSelectedProjectId(null);
        }}
      />
    </div>
  );
};

export default HomePage;
