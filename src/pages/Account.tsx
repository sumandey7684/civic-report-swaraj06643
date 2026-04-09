import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, logoutUser } from "@/lib/authApi";
// import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, BarChart3, MapPin, Award, Activity, LogOut, AlertCircle, Users, CheckCircle, Clock, TrendingUp, Filter, Search, MoreHorizontal, Eye, Edit, Archive, Zap } from "lucide-react";

interface Profile {
  name?: string;
  email?: string;
  profile_photo?: string;
  bio?: string;
  role: "admin" | "citizen";
}

interface Stats {
  reportsSubmitted: number;
  rewardsEarned: number;
  issuesResolved: number;
}

const initialIssues = [
  {
    id: "ISS-001",
    title: "Broken street light near Ram Mandir Square",
    description: "Bhai, e street light ta 3 din dhari bandh achhi. Rati bele loka mane chalibaku bhaya laguchi, safety khatra heuchhi.",
    location: "Ram Mandir Square, Bhubaneswar",
    category: "Infrastructure",
    priority: "High",
    status: "In Progress",
    citizenName: "Satyajit Das",
  },
  {
    id: "ISS-002",
    title: "Bada pothole near Master Canteen Bus Stop",
    description: "Master Canteen bus stop re gote bada pothole heichi. Gadi mane phasi jauchhi, jam o gadi damage heuchhi.",
    location: "Master Canteen, Bhubaneswar",
    category: "Road",
    priority: "Critical",
    status: "Pending",
    citizenName: "Subhasmita Nayak",
  },
  {
    id: "ISS-003",
    title: "Garbage pile up in Saheed Nagar Lane-4",
    description: "2 din dhari garbage uthai nahanti. Smell bahut kharap heijauchi, mosquito bhi baruchi.",
    location: "Saheed Nagar, Lane-4, Bhubaneswar",
    category: "Sanitation",
    priority: "Medium",
    status: "Resolved",
    citizenName: "Rakesh Pradhan",
  },
];

const Account: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ reportsSubmitted: 0, rewardsEarned: 0, issuesResolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Admin Dashboard State
  const [allIssues, setAllIssues] = useState(initialIssues);
  const [filteredIssues, setFilteredIssues] = useState(initialIssues);
  const [visibleCount, setVisibleCount] = useState(3);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAction, setActiveAction] = useState<number | null>(null);

  const fetchProfileAndStats = async () => {
    try {
      const user = getCurrentUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setProfile({
        name: user.name,
        email: user.email,
        role: user.role
      });

      // Fetch stats (mock data for now)
      setStats({
        reportsSubmitted: 15,
        rewardsEarned: 7,
        issuesResolved: 8,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Admin Dashboard Data
  const adminStats = [
    {
      title: "Total Issues",
      value: "1,247",
      change: "+12%",
      icon: AlertCircle,
      bgColor: "bg-gradient-to-br from-blue-100 to-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: "892",
      change: "+8%",
      icon: Users,
      bgColor: "bg-gradient-to-br from-green-100 to-green-50",
      color: "text-green-600",
    },
    {
      title: "Resolved Today",
      value: "34",
      change: "+25%",
      icon: CheckCircle,
      bgColor: "bg-gradient-to-br from-purple-100 to-purple-50",
      color: "text-purple-600",
    },
    {
      title: "Avg Response",
      value: "2.3h",
      change: "-15%",
      icon: Clock,
      bgColor: "bg-gradient-to-br from-orange-100 to-orange-50",
      color: "text-orange-600",
    },
  ];

  const quickActions = [
    {
      label: "Create New Issue",
      icon: AlertCircle,
      color: "from-red-500 to-pink-500",
      description: "Submit a new civic issue to the dashboard and track its resolution progress.",
      details: "Use this action to log infrastructure problems, safety hazards, or complaints.",
    },
    {
      label: "Manage Users",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      description: "Administer user accounts, roles, and permissions.",
      details: "Add, edit, or remove users. Assign privileges like admin, operator, or viewer.",
    },
    {
      label: "View Map",
      icon: MapPin,
      color: "from-green-500 to-emerald-500",
      description: "Visualize reported issues on a city-wide or localized map.",
      details: "Explore issue density, filter by category, and click markers for details.",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      color: "from-purple-500 to-violet-500",
      description: "See key statistics and insights about issue trends.",
      details: "Review resolution rate, response time, active issues, and trend analysis.",
    },
  ];

  // Helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  // Filter issues based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredIssues(allIssues);
    } else {
      const filtered = allIssues.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIssues(filtered);
    }
  }, [searchTerm, allIssues]);

  const handleSearch = () => {
    // Search is handled by useEffect
  };

  const handleManageProfile = () => {
    navigate("/settings");
  };

  const handleLogout = async () => {
    logoutUser();
    window.location.href = "/";
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchProfileAndStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-gray-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-gray-50 to-slate-200">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
          <nav className="space-x-6">
            <Link
              to="/account"
              className="text-gray-700 font-medium hover:text-blue-600 transition"
            >
              Overview
            </Link>
            {profile?.role === "admin" && (
              <Link
                to="/admin"
                className="text-gray-700 font-medium hover:text-blue-600 transition"
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/settings"
              className="text-gray-700 font-medium hover:text-blue-600 transition"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Profile Summary */}
        <Card className="mb-10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="w-20 h-20">
                {profile?.profile_photo ? (
                  <AvatarImage src={profile.profile_photo} alt={profile.name} />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {(profile?.name || profile?.email?.split('@')[0] || "U")[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-extrabold text-gray-900">
                    {profile?.name || profile?.email?.split('@')[0] || "User"}
                  </h2>
                  <Badge variant={profile?.role === "admin" ? "default" : "secondary"}>
                    {profile?.role === "admin" ? "👑 Admin" : "🙌 Citizen"}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-4">
                  {profile?.role === "admin"
                    ? "Welcome back, Admin! Manage your city’s civic issues efficiently."
                    : "Welcome to Civic Report! Help make your community better by reporting issues."}
                </p>
                <div className="flex space-x-4">
                  <Button onClick={handleManageProfile} variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Admin Dashboard Section - Only for Admins */}
          {profile?.role === "admin" && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
              {/* Admin Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {adminStats.map((stat, index) => (
                  <Card key={index} className="relative overflow-hidden backdrop-blur-xl bg-white/80 border-0 shadow-lg hover:shadow-xl transition">
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          <div className="flex items-center gap-2 text-emerald-600">
                            <TrendingUp className="w-4 h-4" /> {stat.change}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-lg mb-12">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      className={`w-full justify-start bg-gradient-to-r ${action.color} text-white`}
                      onClick={() => setActiveAction(i)}
                    >
                      <action.icon className="w-5 h-5 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Search & Issues */}
              <Card className="mb-12 bg-white/80 backdrop-blur-xl shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Issues</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearch((s) => !s)}
                    >
                      <Search className="w-4 h-4 mr-2" /> Search
                    </Button>
                  </div>
                  <AnimatePresence>
                    {showSearch && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 flex gap-3"
                      >
                        <input
                          type="text"
                          placeholder="Search issues..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <Button onClick={handleSearch}>Go</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardHeader>
                <CardContent>
                  {filteredIssues.slice(0, visibleCount).map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 border rounded-xl mb-4 bg-white/70 hover:bg-white"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">{issue.title}</h4>
                        <Badge className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{issue.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {issue.location}
                      </p>
                    </div>
                  ))}
                  {visibleCount < filteredIssues.length && (
                    <div className="text-center mt-4">
                      <Button onClick={() => setVisibleCount((p) => p + 3)}>
                        <Zap className="w-4 h-4 mr-2" /> Load More
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Modal */}
              <AnimatePresence>
                {activeAction !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="bg-white rounded-2xl p-6 w-full max-w-md"
                    >
                      <h3 className="font-bold text-lg mb-2">
                        {quickActions[activeAction].label}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {quickActions[activeAction].description}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {quickActions[activeAction].details}
                      </p>
                      <div className="text-right mt-4">
                        <Button onClick={() => setActiveAction(null)}>Close</Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.reportsSubmitted}</p>
                  <p className="text-gray-600">Reports Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.rewardsEarned}</p>
                  <p className="text-gray-600">Rewards Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Activity className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.issuesResolved}</p>
                  <p className="text-gray-600">Issues Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="hover:shadow-xl transition cursor-pointer" onClick={handleManageProfile}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Details
              </CardTitle>
              <CardDescription>Update your name, email, and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">
                Manage Profile
              </Button>
            </CardContent>
          </Card>

          {/* Admin Dashboard */}
          {profile?.role === "admin" && (
            <Card className="hover:shadow-xl transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>Access reports, track issues, and manage users.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin">
                  <Button variant="default" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Settings Card */}
          <Card className="hover:shadow-xl transition cursor-pointer" onClick={handleManageProfile}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
              <CardDescription>Customize your theme, notifications, and privacy.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">
                Open Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
