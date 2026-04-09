import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
} from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";

// @ts-expect-error Framer Motion does not provide Button type
const MotionButton = motion(Button);

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Issues",
      value: "1,247",
      change: "+12%",
      icon: AlertCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Users",
      value: "842",
      change: "+8%",
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Resolved Today",
      value: "34",
      change: "+23%",
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Pending Issues",
      value: "156",
      change: "-5%",
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  const allIssues = [
    {
      id: "ISS-1001",
      title: "Pothole on Janpath Road",
      location: "Ward 5, Janpath Road",
      priority: "High",
      status: "In Progress",
      assignee: "Road Dept.",
      reportedBy: "Pradeep Das",
      timeAgo: "2 hours ago",
    },
    {
      id: "ISS-1002",
      title: "Broken Street Light",
      location: "Ward 2, Saheed Nagar",
      priority: "Medium",
      status: "Pending",
      assignee: "Electrical Dept.",
      reportedBy: "Ipsita Mohanty",
      timeAgo: "4 hours ago",
    },
    {
      id: "ISS-1003",
      title: "Garbage Collection Missed",
      location: "Ward 1, Kharvel Nagar",
      priority: "Low",
      status: "Resolved",
      assignee: "Sanitation Dept.",
      reportedBy: "Bikash Sahu",
      timeAgo: "1 day ago",
    },
    {
      id: "ISS-1004",
      title: "Water Supply Disruption",
      location: "Ward 3, Nandan Vihar",
      priority: "Critical",
      status: "In Progress",
      assignee: "Water Dept.",
      reportedBy: "Swapna Patnaik",
      timeAgo: "30 minutes ago",
    },
    {
      id: "ISS-1005",
      title: "Overflowing Drain",
      location: "Ward 4, Bapuji Nagar",
      priority: "High",
      status: "Pending",
      assignee: "Sanitation Dept.",
      reportedBy: "Rohit Behera",
      timeAgo: "3 hours ago",
    },
    {
      id: "ISS-1006",
      title: "Traffic Signal Not Working",
      location: "Ward 6, Janpath Crossing",
      priority: "Medium",
      status: "In Progress",
      assignee: "Traffic Dept.",
      reportedBy: "Sasmita Patra",
      timeAgo: "1 hour ago",
    },
    {
      id: "ISS-1007",
      title: "Street Cleaning Required",
      location: "Ward 7, Ashok Nagar",
      priority: "Low",
      status: "Pending",
      assignee: "Sanitation Dept.",
      reportedBy: "Manoj Mishra",
      timeAgo: "5 hours ago",
    },
    {
      id: "ISS-1008",
      title: "Tree Fallen",
      location: "Ward 8, Rasulgarh",
      priority: "Critical",
      status: "In Progress",
      assignee: "Road Dept.",
      reportedBy: "Sunita Mohanty",
      timeAgo: "1 hour ago",
    },
    {
      id: "ISS-1009",
      title: "Waterlogging Issue",
      location: "Ward 9, Khandagiri",
      priority: "High",
      status: "Pending",
      assignee: "Water Dept.",
      reportedBy: "Anil Patnaik",
      timeAgo: "2 hours ago",
    },
    {
      id: "ISS-1010",
      title: "Street Light Flickering",
      location: "Ward 10, Saheed Nagar",
      priority: "Medium",
      status: "Resolved",
      assignee: "Electrical Dept.",
      reportedBy: "Rina Sahu",
      timeAgo: "6 hours ago",
    },
  ];

  const [filteredIssues, setFilteredIssues] = useState(allIssues);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const handleFilter = (filterType: "priority" | "status", value: string) => {
    const filtered = allIssues.filter((issue) => issue[filterType] === value);
    setFilteredIssues(filtered);
    setVisibleCount(5);
  };

  const handleSearch = () => {
    const searched = allIssues.filter((issue) =>
      issue.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIssues(searched);
    setVisibleCount(5);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage civic issues, oversee operations, and track performance
                metrics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="glass-effect hover-lift">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Issues Table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    Recent Issues
                  </CardTitle>
                  <div className="flex gap-2">
                    <MotionButton
                      variant="outline"
                      size="sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </MotionButton>
                    <MotionButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearch((prev) => !prev)}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </MotionButton>
                  </div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Enter Issue ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <Button onClick={handleSearch}>Go</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {["Critical", "High", "Medium", "Low"].map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      onClick={() => handleFilter("priority", p)}
                    >
                      {p}
                    </Button>
                  ))}
                  {["In Progress", "Pending", "Resolved"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      onClick={() => handleFilter("status", s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredIssues
                      .slice(0, visibleCount)
                      .map((issue, index) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-sm text-muted-foreground">
                                  {issue.id}
                                </span>
                                <Badge
                                  className={getPriorityColor(issue.priority)}
                                >
                                  {issue.priority}
                                </Badge>
                                <Badge className={getStatusColor(issue.status)}>
                                  {issue.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-foreground mb-1">
                                {issue.title}
                              </h4>
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <MapPin className="w-3 h-3 mr-1" />
                                {issue.location}
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Assigned to: {issue.assignee}</span>
                                <span>Reported by: {issue.reportedBy}</span>
                                <span>{issue.timeAgo}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingIssue(issue)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
                {visibleCount < filteredIssues.length && (
                  <div className="mt-4 text-center">
                    <MotionButton
                      variant="outline"
                      onClick={() => setVisibleCount((prev) => prev + 5)}
                      whileHover={{ scale: 1.05 }}
                    >
                      View All Issues
                    </MotionButton>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Create New Issue", icon: AlertCircle },
                  { label: "Manage Users", icon: Users },
                  { label: "View Map", icon: MapPin },
                  { label: "Analytics", icon: BarChart3 },
                  { label: "Archived Issues", icon: Archive },
                ].map((action, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Button className="w-full justify-start" variant="outline">
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white p-6 rounded w-96"
            >
              <h3 className="font-bold mb-4">Edit Issue {editingIssue.id}</h3>
              <input
                type="text"
                value={editingIssue.title}
                onChange={(e) =>
                  setEditingIssue({ ...editingIssue, title: e.target.value })
                }
                className="w-full mb-2 border px-2 py-1 rounded"
              />
              <select
                value={editingIssue.priority}
                onChange={(e) =>
                  setEditingIssue({ ...editingIssue, priority: e.target.value })
                }
                className="w-full mb-2 border px-2 py-1 rounded"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select
                value={editingIssue.status}
                onChange={(e) =>
                  setEditingIssue({ ...editingIssue, status: e.target.value })
                }
                className="w-full mb-4 border px-2 py-1 rounded"
              >
                <option>In Progress</option>
                <option>Pending</option>
                <option>Resolved</option>
              </select>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setEditingIssue(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    setFilteredIssues((prev) =>
                      prev.map((i) =>
                        i.id === editingIssue.id ? editingIssue : i
                      )
                    );
                    setEditingIssue(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
