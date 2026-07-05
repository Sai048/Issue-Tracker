import { useEffect, useState } from "react";
import {
  Home,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Layers3,
  ListTodo,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

type sidebarItem = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const Sidebar = ({ collapsed, setCollapsed }: sidebarItem) => {
  const [open, setOpen] = useState(false);

  const [role, setRole] = useState<string>("");

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate("/");
  };

  useEffect(() => {
    const getRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setRole(data.role);
    };

    getRole();
  }, []);

  const menuItems = [
    {
      name: "Home",
      path: "/home",
      icon: Home,
    },

    {
      name: "Teams",
      path: "/teams",
      icon: Layers3,
    },

    {
      name: "Team Members",
      path: "/team-members",
      icon: Users,
    },

    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
    },


    {
      name: "My Tasks",
      path: "/my-tasks",
      icon: ListTodo,
    },

    ...(role === "admin"
      ? [
          {
            name: "Users",
            path: "/users",
            icon: UserCog,
          },
        ]
      : []),

    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="
          fixed left-4 top-4 z-[60]
          rounded-lg bg-slate-900 p-2
          text-white shadow-lg
          lg:hidden
        "
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="
            fixed inset-0 z-40 bg-black/40
            lg:hidden
          "
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          bg-slate-900 text-white
          transition-all duration-300

          ${collapsed ? "lg:w-24" : "lg:w-64"}

          w-64

          ${open ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className="
              relative flex h-20 items-center
              border-b border-slate-700
              px-4
            "
          >
            {/* Collapse Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="
                absolute -right-4 top-1/2 hidden
                -translate-y-1/2 rounded-full
                border border-slate-700
                bg-slate-800 p-2
                text-slate-300 shadow-lg
                transition hover:bg-slate-700
                lg:flex
              "
            >
              {collapsed ? (
                <ChevronRight size={16} className="cursor-pointer" />
              ) : (
                <ChevronLeft size={16} className="cursor-pointer" />
              )}
            </button>

            {/* Logo */}
            <div
              className={`
                flex w-full items-center
                ${collapsed ? "justify-center" : "justify-start"}
              `}
            >
              <span
                className={`
                  text-2xl font-bold
                  text-teal-400 transition-all
                  duration-300

                  ${collapsed ? "hidden" : "block"}
                `}
              >
                Tracker
              </span>

              {collapsed && <span className="text-3xl">🚀</span>}
            </div>
          </div>

          {/* Menu */}
          <nav className="mt-6 flex-1 space-y-2 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    rounded-xl px-4 py-3
                    transition-all duration-200

                    ${collapsed ? "justify-center" : "justify-start"}

                    ${
                      isActive
                        ? "bg-teal-500 text-white shadow-md"
                        : "text-slate-300 hover:bg-slate-800"
                    }
                  `
                  }
                >
                  <Icon size={22} className="shrink-0" />

                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-700 p-3">
            <button
              onClick={handleLogout}
              className={`
                flex w-full items-center gap-3
                rounded-xl bg-red-500
                px-4 py-3
                transition hover:bg-red-600 cursor-pointer

                ${collapsed ? "justify-center" : "justify-start"}
              `}
            >
              <LogOut size={20} className="shrink-0" />

              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
