import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard: React.FC = () => {
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        // handle error or redirect to login
        return;
      }
      const userId = userData.user.id;
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }
      setProfile(profileData);
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {profile ? (
        <div>
          <p className="text-xl">
            <span className="font-semibold">
              {profile.name || profile.email}
            </span>
          </p>
          {/* Rest of admin dashboard content */}
        </div>
      ) : (
        <p>Access is denied.First verify your Admin account.</p>
      )}
    </div>
  );
};

export default AdminDashboard;
