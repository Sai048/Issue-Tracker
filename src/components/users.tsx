import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserPlus, Users } from "lucide-react";
import Sidebar from "./sidebar";
import Loading from "./loading";
import { supabase, supabaseAdmin } from "./supabase-client";
import ConfirmModal from "./modal/modal";
import CreateUserModal from "./modal/createmodal";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const [selectedRole, setSelectedRole] = useState<
    "admin" | "manager" | "developer"
  >("developer");

  const [actionType, setActionType] = useState<"role" | "delete" | null>(null);

  const [processing, setProcessing] = useState(false);

  const createUser = async (
    fullName: string,
    email: string,
    password: string,
    role: "admin" | "manager" | "developer",
  ) => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      console.error(error);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);

    if (profileError) {
      console.error(profileError);
      return;
    }

    fetchUsers();
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;

    setProcessing(true);

    if (actionType === "role") {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: selectedRole,
        })
        .eq("id", selectedUser.id);

      if (!error) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser?.id
              ? {
                  ...u,
                  role: users.find((x) => x.id === u.id)?.role ?? u.role,
                }
              : u,
          ),
        );
      } else {
        console.error(error);
      }
    }

    if (actionType === "delete") {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(
        selectedUser.id,
      );

      if (error) {
        console.error(error);
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

      if (!error) {
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      } else {
        console.error(error);
      }
    }

    setProcessing(false);
    setModalOpen(false);
    setSelectedUser(null);
  };

  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setCurrentUserId(user.id);
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-green-100 text-green-700";

      case "manager":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-teal-500" />
              Users
            </h1>

            <p className="text-slate-500 mt-1">
              Manage your workspace members.
            </p>
          </div>

          <button
            className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-3 rounded-lg transition"
            onClick={() => setCreateModalOpen(true)}
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>

        {createModalOpen && (
          <CreateUserModal
            isOpen={createModalOpen}
            loading={processing}
            onCancel={() => setCreateModalOpen(false)}
            onCreate={createUser}
          />
        )}

        {/* Search */}

        <div className="relative mb-6 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-teal-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    User
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Role
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-slate-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {user.full_name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-700">{user.email}</td>

                      <td className="px-6 py-4">
                        <select
                          disabled={
                            user.id === currentUserId || updatingId === user.id
                          }
                          value={user.role}
                          onChange={(e) => {
                            setSelectedUser(user);
                            setSelectedRole(
                              e.target.value as
                                | "admin"
                                | "manager"
                                | "developer",
                            );
                            setActionType("role");
                            setModalOpen(true);
                          }}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold border outline-none ${
                            user.id === currentUserId || updatingId === user.id
                              ? "opacity-60 cursor-not-allowed"
                              : "cursor-pointer"
                          } ${getRoleColor(user.role)}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="developer">Developer</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {new Date(user.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            disabled={user.id === currentUserId}
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("delete");
                              setModalOpen(true);
                            }}
                            className={`p-2 rounded-lg transition ${
                              user.id === currentUserId
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <ConfirmModal
        isOpen={modalOpen}
        loading={processing}
        title={actionType === "delete" ? "Delete User" : "Update User Role"}
        message={
          actionType === "delete"
            ? `Are you sure you want to delete "${selectedUser?.full_name}"?`
            : `Change ${selectedUser?.full_name}'s role to "${selectedRole}"?`
        }
        confirmText={actionType === "delete" ? "Delete" : "Update"}
        confirmColor={
          actionType === "delete"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-teal-500 hover:bg-teal-600"
        }
        onCancel={() => {
          setModalOpen(false);
          setSelectedUser(null);

          fetchUsers();
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default UsersPage;
