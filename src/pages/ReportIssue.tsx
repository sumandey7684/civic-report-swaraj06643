import React, { useState, useRef, useEffect } from "react";
import { authApi, issuesApi, getToken } from "@/lib/api";
import axios from "axios";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
// Removed Leaflet imports for Google Maps integration
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Camera, MapPin, LogIn, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

const ReportIssue = () => {
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Leaderboard dialog state and data
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{ id: string; name: string; count: number }[]>([]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data, error } = await authApi.me();
      if (error || !data?.user) {
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Voice Assistant Handler
  const handleVoiceCall = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Voice Assistant Not Supported", description: "Your browser does not support speech recognition." });
      return;
    }
    if (!isListening) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setFormData((prev) => ({ ...prev, description: transcript }));
      };
      recognition.onerror = (event: any) => {
        toast({ title: "Voice Error", description: event.error });
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // Fetch leaderboard data function
  const fetchLeaderboard = async () => {
    const { data, error } = await issuesApi.leaderboard();

    if (error) {
      toast({ title: "Error fetching leaderboard", description: error });
      return;
    }

    setLeaderboardData(data || []);
  };

  useEffect(() => {
    if (leaderboardOpen) {
      fetchLeaderboard();
    }
  }, [leaderboardOpen]);

  const [issues, setIssues] = useState([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  useEffect(() => {
    const fetchIssues = async () => {
      const { data, error } = await issuesApi.list();
      if (!error && data) setIssues(data as any);
    };
    fetchIssues();
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [visionLoading, setVisionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    priority: "medium",
  });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const mapRef = useRef(null);

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = "AIzaSyDcNoYhpNi1jR5YUIetR2bWVwNnAKUChZk";

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Get user's location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPosition({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            location: `${latitude}, ${longitude}`,
          }));
          if (mapRef.current) {
            mapRef.current.panTo({ lat: latitude, lng: longitude });
          }
        },
        () => {
          toast({ title: "Location Error", description: "Unable to fetch your location." });
        }
  );
    } else {
      toast({ title: "Geolocation not supported" });
    }
  };

  // Map categories to Google Vision labels
  const categoryLabels = {
    roads: ["road", "street", "highway", "asphalt", "intersection"],
    water: ["water", "pipe", "faucet", "tap", "leak"],
    electricity: ["electricity", "power", "pole", "wire", "transformer"],
    waste: ["garbage", "waste", "trash", "dump", "litter"],
    streetlights: ["street light", "lamp", "lighting", "pole"],
    drainage: ["drain", "sewer", "gutter", "pipe", "water"],
    other: [],
  };

  // File upload handler with 100MB limit and Google Vision validation
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 100 * 1024 * 1024; // 100MB

    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: "⚠️ File too large",
          description: `${file.name} exceeds 100MB and was skipped.`,
        });
        continue;
      }
      setVisionLoading(true);
      // Face detection upload route
      const formData = new FormData();
      formData.append("photo", file);
      try {
        const res = await fetch("http://localhost:3000/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.error) {
          toast({ title: "❌ Invalid photo", description: data.error });
        } else {
          toast({ title: "✅ Suitable for upload", description: "Photo accepted, no human face detected." });
          setSelectedFiles((prev) => [...prev, file]);
        }
      } catch (err) {
        toast({ title: "Upload Error", description: "Could not validate image." });
      }
      setVisionLoading(false);
    }
  };

  // Drag & Drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const maxSize = 100 * 1024 * 1024;

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast({
          title: "⚠️ File too large",
          description: `${file.name} exceeds 100MB and was skipped.`,
        });
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "✅ Issue submitted successfully!",
        description:
          "Your civic issue has been reported and will be reviewed by authorities.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        priority: "medium",
      });
      setSelectedFiles([]);
    }, 2000);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-dark-blue-gradient dark:text-white">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-dark-blue-gradient dark:text-white">
        <Header />
        <main className="pt-20 pb-12">
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-6"
              >
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="btn-framer-ghost"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
                  Report Civic Issue
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Help improve your community by reporting civic issues. Your
                  reports help authorities prioritize and resolve problems faster.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)]">
                  <CardHeader className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <LogIn className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Please Login First</CardTitle>
                    <CardDescription className="text-lg">
                      Please login first and report then for better functionality.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      To report civic issues and contribute to your community, you need to be logged in.
                      This helps us track contributions and show you on the leaderboard.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        className="btn-framer-primary"
                        onClick={() => navigate("/login")}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Login to Report
                      </Button>
                      <Button
                        variant="outline"
                        className="btn-framer-ghost"
                        onClick={() => navigate("/")}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-white text-black dark:bg-dark-blue-gradient dark:text-white">
    <Header />
    <main className="pt-20 pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Leaderboard button centered at top */}
        <div className="flex justify-center mb-4">
          <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
          <DialogTrigger asChild>
            <Button
              className="transform transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-full border-2 border-yellow-400 shadow-md"
            >
              🏆 Leaderboard
            </Button>
          </DialogTrigger>
          <DialogContent
            className="backdrop-blur-md bg-white/20 border border-white/30 shadow-2xl rounded-2xl bg-gradient-to-br from-white/25 to-white/10"
          >
            <DialogHeader>
              <DialogTitle>Top Contributors</DialogTitle>
              <DialogDescription>
                Based on report submissions from accounts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto mt-4">
              {leaderboardData.length === 0 ? (
                <p className="text-muted-foreground">No data available.</p>
              ) : (
                leaderboardData.map((user, index) => (
                  <div key={user.id} className="flex justify-between border-b border-muted-foreground/20 py-2">
                    <span>{user.name}</span>
                    <span className="font-semibold">{user.count}</span>
                  </div>
                ))
              )}
            </div>
            <DialogClose asChild>
              <Button variant="outline" className="mt-4 w-full">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
          </Dialog>
        </div>

        {/* Report Issue Header with Voice Assistant on right */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Reported Issues</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition ${isListening ? "animate-pulse" : ""}`}
              onClick={handleVoiceCall}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v2.25m0 0h-3.75m3.75 0h3.75m-7.5-2.25a9 9 0 1118 0v2.25a2.25 2.25 0 01-2.25 2.25h-11.25A2.25 2.25 0 013 21v-2.25a9 9 0 0118 0" />
              </svg>
              {isListening ? "Listening..." : "Civic Voice Assistant"}
            </button>
            {voiceTranscript && (
              <span className="text-sm text-muted-foreground">Transcript: {voiceTranscript}</span>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
              onClick={async () => {
                // Use MediaDevices.getUserMedia for direct camera access
                setCameraLoading(true);
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
                    // Create a video element to show the stream
                    const video = document.createElement("video");
                    video.srcObject = stream;
                    video.play();
                    video.setAttribute("playsinline", "true");
                    video.style.position = "fixed";
                    video.style.top = "50%";
                    video.style.left = "50%";
                    video.style.transform = "translate(-50%, -50%)";
                    video.style.zIndex = "9999";
                    video.style.width = "320px";
                    video.style.height = "240px";
                    document.body.appendChild(video);

                    // Add a capture button
                    const captureBtn = document.createElement("button");
                    captureBtn.textContent = "Capture";
                    captureBtn.style.position = "fixed";
                    captureBtn.style.top = "calc(50% + 130px)";
                    captureBtn.style.left = "50%";
                    captureBtn.style.transform = "translateX(-50%)";
                    captureBtn.style.zIndex = "10000";
                    captureBtn.style.padding = "8px 16px";
                    captureBtn.style.background = "#2563eb";
                    captureBtn.style.color = "#fff";
                    captureBtn.style.borderRadius = "8px";
                    captureBtn.style.border = "none";
                    captureBtn.style.fontWeight = "bold";
                    document.body.appendChild(captureBtn);

                    captureBtn.onclick = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
                      canvas.toBlob(async (blob) => {
                        if (blob) {
                          const file = new File([blob], `photo_${Date.now()}.png`, { type: "image/png" });
                          setSelectedFiles((prev) => [...prev, file]);
                          // Auto-detect location and time
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              async (position) => {
                                const { latitude, longitude } = position.coords;
                                setMarkerPosition({ lat: latitude, lng: longitude });
                                // Reverse geocode to get place name
                                try {
                                  const apiKey = "AIzaSyDcNoYhpNi1jR5YUIetR2bWVwNnAKUChZk";
                                  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                                  const data = await response.json();
                                  let placeName = `${latitude}, ${longitude}`;
                                  if (data.results && data.results.length > 0) {
                                    placeName = data.results[0].formatted_address;
                                  }
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: placeName,
                                  }));
                                  toast({ title: "Location Detected", description: placeName });
                                } catch (err) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: `${latitude}, ${longitude}`,
                                  }));
                                  toast({ title: "Location Detected", description: `Lat: ${latitude}, Lng: ${longitude}` });
                                }
                              },
                              () => {
                                toast({ title: "Location Error", description: "Unable to fetch your location." });
                              }
                            );
                          }
                          const now = new Date();
                          toast({ title: "Photo Captured", description: `Time: ${now.toLocaleString()}` });
                        }
                        // Cleanup
                        stream.getTracks().forEach(track => track.stop());
                        document.body.removeChild(video);
                        document.body.removeChild(captureBtn);
                        setCameraLoading(false);
                      }, "image/png");
                    };
                  } catch (err) {
                    toast({ title: "Camera Error", description: "Unable to access camera." });
                    setCameraLoading(false);
                  }
                } else {
                  toast({ title: "Camera Not Supported", description: "Your device does not support direct camera access." });
                  setCameraLoading(false);
                }
              }}
            >
              <Camera className="h-5 w-5" />
              {cameraLoading ? "Capturing..." : "Open Camera"}
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">Reported Issues</h2>
        <div className="space-y-4 mb-8">
          {issues.length === 0 ? (
            <div className="text-muted-foreground">No issues reported yet.</div>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="border rounded p-4 bg-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{issue.title}</span>
                  <span className="text-xs px-2 py-1 rounded bg-muted">{issue.status}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-1">Category: {issue.category}</div>
                <div className="text-sm text-muted-foreground mb-1">Location: {issue.location}</div>
                <div className="text-sm text-muted-foreground mb-1">Priority: {issue.priority}</div>
                <div className="text-sm text-muted-foreground">Description: {issue.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-6"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="btn-framer-ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
              Report Civic Issue
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Help improve your community by reporting civic issues. Your
              reports help authorities prioritize and resolve problems faster.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)]">
              <CardHeader>
                <CardTitle className="text-2xl">Issue Details</CardTitle>
                <CardDescription>
                  Please provide detailed information about the civic issue
                  you're reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Issue Title & Category */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Issue Title
                      </label>
                      <Input
                        placeholder="Brief description of the issue"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roads">
                            Roads & Infrastructure
                          </SelectItem>
                          <SelectItem value="water">Water Supply</SelectItem>
                          <SelectItem value="electricity">
                            Electricity
                          </SelectItem>
                          <SelectItem value="waste">
                            Waste Management
                          </SelectItem>
                          <SelectItem value="streetlights">
                            Street Lights
                          </SelectItem>
                          <SelectItem value="drainage">Drainage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <div className="relative mb-2 flex gap-2 items-center">
                      <Input
                        placeholder="Enter location or address"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={handleLocateMe}
                        title="Use my location"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={manualMode ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() => setManualMode((prev) => !prev)}
                      >
                        {manualMode ? "Manual Mode On" : "Manual Location"}
                      </Button>
                    </div>
                    {/* Google Maps Integration */}
                    <div className="h-[300px] w-full rounded overflow-hidden border">
                      {isLoaded && (
                        <GoogleMap
                          center={markerPosition || { lat: 20.5937, lng: 78.9629 }}
                          zoom={markerPosition ? 15 : 5}
                          mapContainerStyle={{ height: "100%", width: "100%" }}
                          onLoad={map => { mapRef.current = map; }}
                          onClick={manualMode ? (e => {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            setMarkerPosition({ lat, lng });
                            setFormData((prev) => ({ ...prev, location: `${lat}, ${lng}` }));
                          }) : undefined}
                        >
                          {markerPosition && (
                            <Marker
                              position={markerPosition}
                              draggable={manualMode}
                              onDragEnd={e => {
                                const lat = e.latLng.lat();
                                const lng = e.latLng.lng();
                                setMarkerPosition({ lat, lng });
                                setFormData((prev) => ({
                                  ...prev,
                                  location: `${lat}, ${lng}`,
                                }));
                              }}
                            />
                          )}
                        </GoogleMap>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Use the location pin to auto-fill, or enable manual mode to drag/select location on the map.</p>
                  </div>

                  {/* ...existing code... */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Priority Level
                    </label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">
                          Medium Priority
                        </SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ...existing code... */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Description</label>
                      <button
                        type="button"
                        className={`p-2 rounded-full bg-white/30 backdrop-blur shadow hover:bg-white/50 transition border border-white/40 ml-2 ${isListening ? "animate-pulse" : ""}`}
                        title={isListening ? "Listening..." : "Start Voice Input"}
                        onClick={handleVoiceCall}
                      >
                        <span className="text-xl">🎙️</span>
                      </button>
                    </div>
                    <Textarea
                      placeholder="Please provide detailed description of the issue"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      required
                    />
                  </div>

                  {/* ...existing code... */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">
                      Upload Photos/Videos
                    </label>

                    {/* Drag & Drop / Click Upload */}
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium mb-2">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, MP4 up to 100MB each
                        </p>
                      </label>
                    </div>

                    {/* Mobile Camera Button */}

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium">Selected files:</p>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-3 text-sm bg-muted p-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <video
                                  src={URL.createObjectURL(file)}
                                  className="h-10 w-10 rounded"
                                  muted
                                />
                              )}
                              <span className="truncate max-w-[180px]">
                                {file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ...existing code... */}
                  <Button
                    type="submit"
                    className="btn-framer-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Issue Report"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
  );
};

export default ReportIssue;
