import React, { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Upload, MapPin, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const ReportIssue = () => {
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [imageValid, setImageValid] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    longitude: "",
    latitude: "",
    priority: "medium",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  // Speech recognition state
  type SpeechRecognitionErrorEvent = Event & {
    error?: string;
    message?: string;
  };

  interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onerror: ((event: any) => void) | null;
    start: () => void;
    stop: () => void;
  }
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    // Check browser support and HTTPS
    const isHttps = window.location.protocol === "https:";

    // Strongly type the window extension to avoid 'any' casts
    const globalWindow = window as Window & {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };

    const SpeechRecognitionCtor =
      globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;

    if (!isHttps) {
      setSpeechError(
        "Speech recognition requires HTTPS for microphone access."
      );
      setSpeechSupported(false);
      return;
    }
    if (SpeechRecognitionCtor) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognitionCtor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        setFormData((prev) => ({
          ...prev,
          description:
            prev.description.replace(/\s*$/, "") +
            (finalTranscript || interimTranscript),
        }));
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        setSpeechError(
          event.error === "not-allowed"
            ? "Microphone access denied. Please allow access to use voice input."
            : `Speech recognition error: ${event.error}`
        );
      };
    } else {
      setSpeechError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge on HTTPS."
      );
      setSpeechSupported(false);
    }
  }, []);

  const handleMicClick = () => {
    setSpeechError("");
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ✅ Load Google Maps script once and init map when modal opens
  // Use the provided Google Maps API key
  const apiKey = "AIzaSyDcNoYhpNi1jR5YUIetR2bWVwNnAKUChZk";
  useEffect(() => {
    if (!showMap || !mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function initMap() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).google?.maps || !mapRef.current) {
        console.log("Google Maps API not loaded or mapRef missing");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 22.5726, lng: 88.3639 },
        zoom: 13,
      });
      console.log("Map loaded", map);
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setCenter({ lat, lng });
          setFormData((prev) => ({
            ...prev,
            location: `${lat}, ${lng}`,
            latitude: lat.toString(),
            longitude: lng.toString(),
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
        });
      }
      // Add draggable marker for manual selection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let marker: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addListener("click", function (e: any) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (marker) marker.setMap(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker = new (window as any).google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });
        setFormData((prev) => ({
          ...prev,
          location: `${lat}, ${lng}`,
          latitude: lat.toString(),
          longitude: lng.toString(),
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.addListener("dragend", function (event: any) {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          setFormData((prev) => ({
            ...prev,
            location: `${newLat}, ${newLng}`,
            latitude: newLat.toString(),
            longitude: newLng.toString(),
          }));
        });
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
    return () => {
      if (mapRef.current) mapRef.current.innerHTML = "";
    };
  }, [showMap, mapRef]);

  // ✅ Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      validateImageWithVision(files[0]);
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // ✅ Handle camera capture
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateImageWithVision(file);
      setSelectedFiles((prev) => [...prev, file]);
    }
  };

  // ✅ Google Vision API validation
  const validateImageWithVision = async (file: File) => {
    setImageError("");
    setImageValid(false);
    setVisionLoading(true);

    // Use only Google Vision API for detection
    const apiKey = "AIzaSyDcNoYhpNi1jR5YUIetR2bWVwNnAKUChZk"; // replace with your key
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(",")[1];
      const body = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "LABEL_DETECTION" }],
          },
        ],
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        let detectedText =
          data.responses?.[0]?.labelAnnotations?.[0]?.description;
        if (typeof detectedText !== "string") detectedText = "";

        // Category-based validation
        let validMessage = "";
        let isValid = false;
        if (
          formData.category === "roads" &&
          /road|pothole|crack|asphalt|broken|damaged|highway|lane|street/i.test(
            detectedText
          )
        ) {
          validMessage = "✅ Road issue detected. You may submit this photo.";
          isValid = true;
        } else if (
          formData.category === "water" &&
          /water|leak|pipe|tap|drain|flood|overflow|wet/i.test(detectedText)
        ) {
          validMessage = "✅ Water issue detected. You may submit this photo.";
          isValid = true;
        } else if (
          formData.category === "electricity" &&
          /electric|wire|cable|transformer|power|outage|shock/i.test(
            detectedText
          )
        ) {
          validMessage =
            "✅ Electricity issue detected. You may submit this photo.";
          isValid = true;
        } else if (
          formData.category === "waste" &&
          /waste|garbage|trash|bin|dump|litter|plastic/i.test(detectedText)
        ) {
          validMessage = "✅ Waste issue detected. You may submit this photo.";
          isValid = true;
        } else if (
          formData.category === "streetlights" &&
          /street\s*light|lamp|pole|bulb|broken|dark/i.test(detectedText)
        ) {
          validMessage =
            "✅ Street light issue detected. You may submit this photo.";
          isValid = true;
        } else if (
          formData.category === "drainage" &&
          /drain|sewer|gutter|blockage|overflow|clog/i.test(detectedText)
        ) {
          validMessage =
            "✅ Drainage issue detected. You may submit this photo.";
          isValid = true;
        } else {
          validMessage =
            " Photo does not match the selected category. Please upload a valid photo for this issue type.";
          isValid = false;
        }
        setImageError(validMessage);
        setImageValid(isValid);
      } catch (err) {
        setImageError("Error in detecting civic issues .");
      } finally {
        setVisionLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageValid) {
      toast({
        title: "❌ Invalid Photo!",
        description:
          imageError ||
          "Photo does not match the selected category. Please upload a valid photo.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "✅ Issue submitted successfully!",
        description:
          "Your civic issue has been reported and will be reviewed by authorities.",
      });
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        longitude: "",
        latitude: "",
        priority: "medium",
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setSelectedFiles([]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
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

        {/* Form Section */}
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
                    {/* Title + Category */}
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
                      <label className="text-sm font-medium">
                        Location (Lat, Lng), Date & Time
                      </label>
                      <div className="relative mb-2 flex gap-2">
                        <Input
                          placeholder="Enter location or coordinates"
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
                          className="h-6"
                          onClick={() => setShowMap(true)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6"
                          style={{
                            minWidth: 80,
                            fontWeight: "bold",
                            color: "#1976d2",
                            borderColor: "#1976d2",
                          }}
                          onClick={() => {
                            setShowMap(true);
                          }}
                        >
                          Manual
                        </Button>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-medium">
                            Latitude
                          </label>
                          <Input
                            type="text"
                            value={formData.latitude}
                            readOnly
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium">
                            Longitude
                          </label>
                          <Input
                            type="text"
                            value={formData.longitude}
                            readOnly
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium">Date</label>
                          <Input type="date" value={formData.date} readOnly />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium">Time</label>
                          <Input type="text" value={formData.time} readOnly />
                        </div>
                      </div>
                    </div>

                    {/* Map Modal */}
                    {showMap && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 relative w-full max-w-2xl">
                          <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowMap(false)}
                          >
                            ✕
                          </button>
                          <h3 className="text-lg font-bold mb-2">
                            Select Location
                          </h3>
                          <div
                            ref={mapRef}
                            id="google-map"
                            style={{ width: "100%", height: "400px" }}
                          />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click on the map to select your issue location.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Priority */}
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

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <div style={{ display: "flex", alignItems: "center" }}>
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
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handleMicClick}
                          style={{
                            marginLeft: 8,
                            background: isListening ? "#1976d2" : "#eee",
                            border: "none",
                            borderRadius: "50%",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: speechSupported ? "pointer" : "not-allowed",
                          }}
                          title={
                            speechSupported
                              ? isListening
                                ? "Stop Recording"
                                : "Start Recording"
                              : "Speech recognition not supported"
                          }
                        >
                          <span
                            role="img"
                            aria-label="mic"
                            style={{
                              color: isListening ? "#fff" : "#1976d2",
                              fontSize: 24,
                            }}
                          >
                            {isListening ? "🔴" : "🎤"}
                          </span>
                        </button>
                      </div>
                      {!speechSupported && (
                        <div style={{ color: "#f00", fontSize: 12 }}>
                          Speech recognition not supported in this browser.
                        </div>
                      )}
                      {isListening && (
                        <div style={{ color: "#1976d2", fontSize: 12 }}>
                          Listening... Speak now.
                        </div>
                      )}
                      {speechError && (
                        <div style={{ color: "#f00", fontSize: 12 }}>
                          {speechError}
                        </div>
                      )}
                    </div>

                    {/* Upload Photos */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium">
                        Upload Photos/Videos
                      </label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
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
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, MP4 up to 10MB each
                          </p>
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleCameraCapture}
                          className="hidden"
                          id="camera-capture"
                        />
                        <label
                          htmlFor="camera-capture"
                          className="cursor-pointer block mt-4"
                        >
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Capture from Camera
                          </span>
                        </label>
                      </div>

                      {visionLoading && (
                        <p className="text-blue-500">
                          Checking image validity...
                        </p>
                      )}
                      {imageError && (
                        <p
                          className={
                            imageValid
                              ? "text-green-600 font-semibold border border-green-400 rounded px-2 py-1 bg-green-50"
                              : "text-red-500 font-semibold border border-red-400 rounded px-2 py-1 bg-red-50"
                          }
                        >
                          {imageError}
                        </p>
                      )}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm bg-muted p-2 rounded"
                            >
                              <Camera className="h-4 w-4" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
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
