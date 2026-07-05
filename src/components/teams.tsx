import { useEffect, useState } from "react";
import { Users, Plus, X, Trash2 } from "lucide-react";
import { supabase } from "./supabase-client";
import Sidebar from "./sidebar";
import Loading from "./loading";
import ConfirmModal from "./modal/modal";
import { useNavigate } from "react-router-dom";

interface Team {
  id: string;
  name: string;
}

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Create Modal
  const [openModal, setOpenModal] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [role, setRole] = useState("");
  const canManageTeams = role === "admin" || role === "manager";

  // Form
  const [teamName, setTeamName] = useState("");

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setRole(data.role);
    }
  };

  // =========================
  // Fetch Teams
  // =========================
  const fetchTeams = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeams(data);
    }

    setLoading(false);
  };

  // =========================
  // Create Team
  // =========================
  const createTeam = async () => {
    if (!teamName.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("teams").insert({
      name: teamName,
      created_by: user.id,
    });

    if (error) {
      console.error(error);
      return;
    }

    setTeamName("");
    setOpenModal(false);

    fetchTeams();
  };

  // =========================
  // Open Delete Modal
  // =========================
  const openDeleteModal = (teamId: string) => {
    setSelectedTeamId(teamId);
    setDeleteModal(true);
  };

  // =========================
  // Delete Team
  // =========================
  const deleteTeam = async () => {
    if (!selectedTeamId) return;

    setDeleteLoading(true);

    // Delete team members first
    const { error: memberError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", selectedTeamId);

    if (memberError) {
      console.error(memberError);
      setDeleteLoading(false);
      return;
    }

    // Delete team
    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("id", selectedTeamId);

    if (teamError) {
      console.error(teamError);
      setDeleteLoading(false);
      return;
    }

    setDeleteModal(false);
    setSelectedTeamId(null);
    setDeleteLoading(false);

    fetchTeams();
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    const load = async () => {
      await getCurrentUser();
      await fetchTeams();
    };

    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* Main Content */}
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
        <div
          className="
      flex flex-col gap-5
      md:flex-row
      md:items-center
      md:justify-between
    "
        >
          <div>
            <h1
              className="
          text-3xl font-bold
          text-slate-800
          sm:text-4xl
        "
            >
              Teams
            </h1>

            <p
              className="
          mt-2 text-sm
          text-slate-500
          sm:text-base
        "
            >
              Manage your teams and collaborate efficiently.
            </p>
          </div>

          {/* Create Team Button */}
          {canManageTeams && (
            <button
              onClick={() => setOpenModal(true)}
              className="
          flex w-full items-center
          justify-center gap-2

          rounded-xl bg-teal-500
          px-5 py-3 text-white
          shadow-md transition
            cursor-pointer
          hover:bg-teal-600

          sm:w-auto
        "
            >
              <Plus size={20} />
              Create Team
            </button>
          )}
        </div>

        {/* Teams Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loading />
            </div>
          ) : teams.length === 0 ? (
            <div
              className="
          rounded-2xl border
          border-slate-200 bg-white
          p-10 text-center shadow-sm
        "
            >
              <Users size={50} className="mx-auto text-slate-300" />

              <h2
                className="
            mt-4 text-2xl
            font-semibold text-slate-700
          "
              >
                No Teams Found
              </h2>

              <p className="mt-2 text-slate-500">
                Create your first team to get started.
              </p>
            </div>
          ) : (
            <div
              className="
          grid gap-6

          sm:grid-cols-2
          xl:grid-cols-3
        "
            >
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="
              group relative rounded-3xl
              border border-slate-200
              bg-white p-5 shadow-sm

              transition duration-300
              hover:-translate-y-1
              hover:shadow-xl
            "
                >
                  {/* Delete Button */}
                  {canManageTeams && (
                    <button
                      onClick={() => openDeleteModal(team.id)}
                      className="
                  absolute right-4 top-4
                  rounded-xl bg-red-50 p-2
                  text-red-500 transition
                    cursor-pointer
                  hover:bg-red-100
                "
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  {/* Icon */}
                  <div
                    className="
                flex h-14 w-14
                items-center justify-center
                rounded-2xl bg-teal-100
              "
                  >
                    <Users className="text-teal-600" size={28} />
                  </div>

                  {/* Name */}
                  <h2
                    className="
                mt-5 break-words
                text-2xl font-bold
                text-slate-800
              "
                  >
                    {team.name}
                  </h2>

                  {/* Description */}
                  <p
                    className="
                mt-2 line-clamp-3
                text-sm text-slate-500
              "
                  >
                    Collaborate with your team members and manage projects
                    efficiently.
                  </p>

                  {/* Button */}
                  <button
                    className="
                mt-6 w-full rounded-xl
                bg-slate-900 py-3
                font-medium text-white
                transition
                cursor-pointer
                hover:bg-slate-800
              "
                    onClick={() => navigate(`/team-members?team=${team.id}`)}
                  >
                    View Team Members
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* ========================= */}
      {/* Create Team Modal */}
      {/* ========================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Create Team</h2>

              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Team Name
              </label>

              <input
                type="text"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={() => setOpenModal(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border cursor-pointer border-slate-300 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={createTeam}
                className="w-full sm:w-auto bg-teal-500 cursor-pointer hover:bg-teal-600 text-white px-5 py-3 rounded-xl transition font-medium"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================= */}
      <ConfirmModal
        isOpen={deleteModal}
        title="Delete Team"
        message="Are you sure you want to delete this team? All team members will also be removed."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        loading={deleteLoading}
        onConfirm={deleteTeam}
        onCancel={() => {
          setDeleteModal(false);
          setSelectedTeamId(null);
        }}
      />
    </div>
  );
};

export default TeamsPage;
