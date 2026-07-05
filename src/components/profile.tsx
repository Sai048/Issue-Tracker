import { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import { supabase } from "./supabase-client";
import Loading from "./loading";

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const getProfile = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(userError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setProfile(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    getProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`
    min-h-screen flex-1
    bg-slate-50
    transition-all duration-300

    px-4 py-20
    sm:px-6
    lg:px-10 lg:py-10

    ${collapsed ? "lg:ml-24" : "lg:ml-64"}
  `}
      >
        <div className="w-full">
          <div
            className="
        overflow-hidden rounded-3xl
        bg-white shadow-lg
      "
          >
            {/* Header */}
            <div
              className="
          flex flex-col items-center gap-4
          bg-gradient-to-r
          from-teal-500 to-cyan-500

          px-6 py-8
          text-center

          sm:flex-row
          sm:items-end
          sm:text-left

          sm:px-8 sm:py-10
        "
            >
              {/* Avatar */}
              <div
                className="
            flex h-24 w-24 shrink-0
            items-center justify-center
            rounded-full border-4 border-white
            bg-white text-4xl font-bold
            text-teal-600 shadow-lg
          "
              >
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="sm:ml-4">
                <h1
                  className="
              break-words text-2xl
              font-bold text-white

              sm:text-3xl
            "
                >
                  {profile?.full_name}
                </h1>

                <p
                  className="
              mt-1 break-all
              text-sm text-white/90

              sm:text-base
            "
                >
                  {profile?.email}
                </p>
              </div>
            </div>

            {/* Profile Details */}
            <div
              className="
          grid grid-cols-1 gap-5
          p-5

          sm:p-8
          md:grid-cols-2
        "
            >
              <ProfileCard
                title="Full Name"
                value={profile?.full_name || "-"}
              />

              <ProfileCard title="Email" value={profile?.email || "-"} />

              <ProfileCard title="Role" value={profile?.role || "-"} />

              <ProfileCard
                title="Created At"
                value={
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface CardProps {
  title: string;
  value: string;
}

const ProfileCard = ({ title, value }: CardProps) => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
      {title}
    </h3>

    <p className="mt-2 text-lg font-medium text-slate-800 break-all">{value}</p>
  </div>
);

export default Profile;
