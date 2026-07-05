import { useState } from "react";
import Loading from "../loading";

interface CreateUserModalProps {
  isOpen: boolean;
  loading: boolean;
  onCancel: () => void;
  onCreate: (
    fullName: string,
    email: string,
    password: string,
    role: "admin" | "manager" | "developer",
  ) => void;
}

interface CreateUserModalState {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "developer";
}

const stateInitial: CreateUserModalState = {
  fullName: "",
  email: "",
  password: "",
  role: "developer",
};

const CreateUserModal = ({
  isOpen,
  loading,
  onCancel,
  onCreate,
}: CreateUserModalProps) => {
  const [data, setData] = useState<CreateUserModalState>(stateInitial);
  const { fullName, email, password, role } = data;

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!fullName || !email || !password) {
      return;
    }

    onCreate(fullName, email, password, role);
    onCancel();
    setData(stateInitial);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">Create User</h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a new workspace user.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value }    )}
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setData({ ...data, email: e.target.value }  )}
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>

            <select
              value={role}
              onChange={(e) =>
                setData({ ...data, role: e.target.value as "admin" | "manager" | "developer" })
              }
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border px-5 py-2 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-teal-500 px-5 py-2 text-white hover:bg-teal-600 cursor-pointer"
          >
            {loading ? <Loading /> : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
