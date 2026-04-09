import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Camera, MapPin, Mic, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const GOOGLE_MAPS_API_KEY = "AIzaSyDcNoYhpNi1jR5YUIetR2bWVwNnAKUChZk";
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPosition({ lat: latitude, lng: longitude });
          setFormData((prev) => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        },
        () => toast({ title: "Location Error", description: "Access denied" })
      );
    }
  };

  const handleVoiceCall = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Not Supported", description: "Speech recognition unavailable" });
      return;
    }
    if (!isListening) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData((prev) => ({ ...prev, description: transcript }));
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: "REPORT TRANSMITTED", description: "Resolution node initialized." });
      navigate("/account");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <section className="container mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16"
          >
            <div className="space-y-4">
              <div className="text-label text-muted-foreground">System / Node / Report</div>
              <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                Submit<br />Civic Data
              </h1>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="text-[10px] uppercase tracking-widest font-black" onClick={handleVoiceCall}>
                <Mic className={`mr-2 h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                {isListening ? "Listening" : "Voice Sync"}
              </Button>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-px bg-border border border-border">
            <div className="lg:col-span-2 bg-background p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">Classification</label>
                    <Select onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-sm uppercase tracking-widest font-black focus:ring-0">
                        <SelectValue placeholder="SELECT CATEGORY" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-background border-border">
                        <SelectItem value="INFRA">Infrastructure</SelectItem>
                        <SelectItem value="UTIL">Utilities</SelectItem>
                        <SelectItem value="SEC">Security</SelectItem>
                        <SelectItem value="ENV">Environment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">Incident Summary</label>
                    <Input 
                      placeholder="ENTER TITLE"
                      className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-sm uppercase tracking-widest font-black focus-visible:ring-0"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">Detailed Observations</label>
                    <Textarea 
                      placeholder="DESCRIBE THE SITUATION"
                      className="rounded-none border border-border bg-muted/30 p-4 text-sm uppercase tracking-widest font-black focus-visible:ring-0 min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">Geospatial Data</label>
                      <Button type="button" variant="link" onClick={handleLocateMe} className="text-[10px] uppercase font-black tracking-widest">
                        <MapPin className="mr-2 h-3 w-3" /> Auto-Locate
                      </Button>
                    </div>
                    <div className="h-[300px] border border-border grayscale hover:grayscale-0 transition-all">
                      {isLoaded && (
                        <GoogleMap
                          center={markerPosition || { lat: 20.5937, lng: 78.9629 }}
                          zoom={markerPosition ? 15 : 5}
                          mapContainerStyle={{ height: "100%", width: "100%" }}
                          onClick={(e) => {
                            const lat = e.latLng?.lat() || 0;
                            const lng = e.latLng?.lng() || 0;
                            setMarkerPosition({ lat, lng });
                            setFormData({...formData, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`});
                          }}
                        >
                          {markerPosition && <Marker position={markerPosition} />}
                        </GoogleMap>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-none text-xs uppercase tracking-[0.4em] font-black"
                >
                  {isSubmitting ? "Transmitting..." : "Initialize Resolution"}
                </Button>
              </form>
            </div>

            <div className="bg-background p-8 md:p-12 space-y-12 border-t lg:border-t-0 lg:border-l border-border">
              <div className="space-y-6">
                <div className="text-label">Visual Verification</div>
                <div 
                  className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Camera className="h-8 w-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Capture Source</div>
                  <input id="file-upload" type="file" className="hidden" multiple />
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-label">Reputation Node</div>
                <div className="p-6 border border-border space-y-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5" />
                    <div className="text-sm font-black uppercase tracking-tighter">Contributor Level 1</div>
                  </div>
                  <div className="h-1 bg-muted w-full">
                    <div className="h-full bg-foreground w-1/4" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                    Improve resolution priority by maintaining high data quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ReportIssue;
