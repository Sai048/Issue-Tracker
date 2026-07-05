import { useEffect, useRef, useState } from "react";
import { Trash2, UserPlus, ChevronDown, Check, X, Search } from "lucide-react";
import Sidebar from "./sidebar";
import { supabase } from "./supabase-client";
import { useSearchParams } from "react-router-dom";
import Loading from "./loading";

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface Member {
  id: string;
  profiles: {
    id: string;
    full_name: string;
    role: string;
  };
}

const TeamMembersPage = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState("");
  const canManageMembers = role === "admin" || role === "manager";
  const teamIdFromUrl = searchParams.get("team");
  const [collapsed, setCollapsed] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  // dropdowns
  const [teamDropdown, setTeamDropdown] = useState(false);

  const [userDropdown, setUserDropdown] = useState(false);

  // search
  const [teamSearch, setTeamSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");

  const teamRef = useRef<HTMLDivElement>(null);

  const userRef = useRef<HTMLDivElement>(null);

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
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setTeams(data);

      // auto select from URL
      if (teamIdFromUrl) {
        const foundTeam = data.find((t) => t.id === teamIdFromUrl);

        if (foundTeam) {
          setSelectedTeam(foundTeam);
          fetchMembers(foundTeam.id);
        }
      }
    }
  };

  // =========================
  // Fetch Users
  // =========================
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name");

    if (!error && data) {
      setUsers(data);
    }
  };

  // =========================
  // Fetch Members
  // =========================
  const fetchMembers = async (teamId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
      id,
      profiles!team_members_user_id_fkey (
        id,
        full_name,
        role
      )
    `,
      )
      .eq("team_id", teamId);

    console.log(data);
    console.log(error);

    if (!error && data) {
      setMembers(data as unknown as Member[]);
    } else {
      setMembers([]);
    }

    setLoading(false);
  };

  // =========================
  // Add Users
  // =========================
  const addMembers = async () => {
    if (!selectedTeam || selectedUsers.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const payload = selectedUsers.map((u) => ({
      team_id: selectedTeam.id,
      user_id: u.id,
      added_by: user.id,
    }));

    const { error } = await supabase.from("team_members").insert(payload);

    if (error) {
      console.error(error);
      return;
    }

    setSelectedUsers([]);

    fetchMembers(selectedTeam.id);
  };

  // =========================
  // Remove Member
  // =========================
  const removeMember = async (memberId: string) => {
    await supabase.from("team_members").delete().eq("id", memberId);

    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
    }
  };

  // =========================
  // Toggle User
  // =========================
  const toggleUser = (user: User) => {
    const exists = selectedUsers.find((u) => u.id === user.id);

    if (exists) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    const load = async () => {
      await getCurrentUser();
      await fetchTeams();
      await fetchUsers();
      setLoading(false);
    };

    load();
  }, []);

  // =========================
  // Close Dropdown
  // =========================
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) {
        setTeamDropdown(false);
      }

      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase()),
  );

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`
    flex-1
    min-h-screen
    p-4
    sm:p-6
    lg:p-8
    transition-all duration-300
    ml-0
    ${collapsed ? "lg:ml-24" : "lg:ml-64"}
  `}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
          Team Members
        </h1>

        <p className="mt-2 text-sm sm:text-base text-slate-500">
          Add and manage team members.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          {/* TEAM DROPDOWN */}
          <div ref={teamRef}>
            <label className="mb-2 block font-semibold">Select Team</label>

            <div className="relative">
              <button
                onClick={() => setTeamDropdown(!teamDropdown)}
                className="
            w-full rounded-2xl border border-slate-300
            bg-white px-4 py-3
            flex items-center justify-between
          "
              >
                <span className="truncate">
                  {selectedTeam ? selectedTeam.name : "Select Team"}
                </span>

                <ChevronDown size={18} />
              </button>

              {teamDropdown && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b p-3">
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                      <Search size={18} />

                      <input
                        type="text"
                        placeholder="Search team..."
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        className="w-full outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setSelectedTeam(team);
                          fetchMembers(team.id);
                          setTeamDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-100"
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* USER DROPDOWN */}
          <div className="mt-6" ref={userRef}>
            <label className="mb-2 block font-semibold">Select Users</label>

            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="
            min-h-[56px]
            w-full
            rounded-2xl
            border border-slate-300
            px-4 py-2
            flex flex-wrap items-center gap-2
          "
              >
                {selectedUsers.length === 0 ? (
                  <span className="text-slate-500">Select Users</span>
                ) : (
                  selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="
                  flex items-center gap-2
                  rounded-full
                  bg-teal-100
                  px-3 py-1
                  text-sm
                  text-teal-700
                "
                    >
                      <span className="truncate max-w-[120px]">
                        {user.full_name}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUser(user);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}

                <div className="ml-auto">
                  <ChevronDown size={18} />
                </div>
              </button>

              {userDropdown && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b p-3">
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                      <Search size={18} />

                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {filteredUsers.map((user) => {
                      const selected = selectedUsers.some(
                        (u) => u.id === user.id,
                      );

                      return (
                        <button
                          key={user.id}
                          onClick={() => toggleUser(user)}
                          className={`
                      w-full flex items-center
                      justify-between px-4 py-3
                      hover:bg-slate-100
                      ${selected ? "bg-teal-50" : ""}
                    `}
                        >
                          <div className="text-left">
                            <p className="font-medium">{user.full_name}</p>

                            <p className="text-sm text-slate-500">
                              {user.role}
                            </p>
                          </div>

                          {selected && (
                            <Check size={18} className="text-teal-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add button */}
          {canManageMembers && (
            <button
              onClick={addMembers}
              className="
          mt-6
          w-full sm:w-auto
          flex items-center justify-center gap-2
          rounded-2xl
          bg-teal-500
          px-6 py-3
          text-white
          hover:bg-teal-600
        "
            >
              <UserPlus size={20} />
              Add Members
            </button>
          )}

          {/* Members */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-slate-800">Team Members</h2>

            <div className="mt-5 grid gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="
              flex flex-col sm:flex-row
              sm:items-center
              justify-between
              gap-4
              rounded-2xl
              border border-slate-200
              bg-slate-50
              px-5 py-4
            "
                >
                  <div>
                    <h3 className="font-semibold">
                      {member.profiles.full_name}
                    </h3>

                    <p className="text-sm text-slate-500 capitalize">
                      {member.profiles.role}
                    </p>
                  </div>

                  {canManageMembers && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="
                  flex items-center gap-2
                  text-red-500 hover:text-red-600
                "
                    >
                      <Trash2 size={18} />
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamMembersPage;
