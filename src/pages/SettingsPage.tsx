import React, { useState, useEffect } from "react";
import { authApi, profilesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadCloud } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  notifications: z.boolean(),
  bio: z.string().max(160).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const SettingsPage: React.FC = () => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const watchedName = watch("name");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await authApi.me();
        if (error) throw new Error(error);

        const user = data?.user;
        if (user) {
          setUserId(user.id);
          const profile = data?.profile;

          if (profile) {
            setValue("name", profile.name || "");
            setValue("notifications", profile.notifications ?? true);
            setProfilePhotoUrl(profile.profile_photo || "");
            setValue("bio", profile.bio || "");
          } else {
            // If no profile exists, use email from auth
            const displayName = user.email?.split('@')[0] || "";
            setValue("name", displayName);
            setValue("notifications", true);
            setProfilePhotoUrl("");
            setValue("bio", "");
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [setValue, toast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setProfilePhotoUrl(previewUrl);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "No user found. Please log in again.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // For now, photo upload is handled as URL-only (no Supabase Storage)
      // In a future iteration, a file upload endpoint can be added to the server
      const { data: updatedProfile, error } = await profilesApi.update(userId, {
        name: data.name,
        bio: data.bio || undefined,
        notifications: data.notifications,
        profile_photo: profilePhotoUrl || undefined,
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to update profile: ${message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-200 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Settings</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-red-600 mt-1 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center space-x-3">
            <Switch
              id="notifications"
              checked={Boolean(watch("notifications"))}
              onCheckedChange={(checked) => setValue("notifications", checked)}
            />
            <Label htmlFor="notifications" className="mb-0">
              Enable Notifications
            </Label>
          </div>

          {/* Profile Photo */}
          <div>
            <Label>Profile Photo</Label>
            <div className="flex items-center space-x-4">
              <Avatar>
                {profilePhotoUrl ? (
                  <AvatarImage src={profilePhotoUrl} alt="Profile" />
                ) : (
                  <AvatarFallback>
                    {(watchedName || "User")[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself"
              {...register("bio")}
              rows={4}
            />
            {errors.bio && (
              <p className="text-red-600 mt-1 text-sm">{errors.bio.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
