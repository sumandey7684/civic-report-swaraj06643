import React, { useEffect, useState } from "react";
import { authApi } from "@/lib/api";

const AdminDashboard: React.FC = () => {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await authApi.me();
      if (error || !data?.user) {
        // handle error or redirect to login
        return;
      }
      setProfile(data.profile || { name: data.user.email?.split('@')[0], email: data.user.email });
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {profile ? (
        <div>
          <p className="text-xl">
            Welcome, <span className="font-semibold">{profile.name || profile.email}</span>
          </p>
          {/* Rest of admin dashboard content */}
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default AdminDashboard;
