import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, AlertTriangle, CheckCircle2, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { visionApi } from "@/lib/api";

// ============================================
// Civic Issue categories for ML detection
// ============================================
const CIVIC_ISSUE_LABELS: Record<string, { keywords: string[]; icon: string; color: string }> = {
  pothole: {
    keywords: ["pothole", "hole", "crater", "pit", "road damage", "broken road", "asphalt", "pavement damage", "road surface"],
    icon: "🕳️",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  waterLeak: {
    keywords: ["water", "leak", "pipe", "flood", "puddle", "wet", "overflow", "sewage", "drain", "burst pipe", "waterlog"],
    icon: "💧",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  garbage: {
    keywords: ["garbage", "trash", "waste", "litter", "dump", "debris", "rubbish", "pollution", "filth", "junk"],
    icon: "🗑️",
    color: "bg-yellow-600/10 text-yellow-600 border-yellow-600/20",
  },
  brokenLight: {
    keywords: ["street light", "lamp", "light pole", "broken light", "dark", "electricity", "bulb", "lighting"],
    icon: "💡",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  drainage: {
    keywords: ["drain", "gutter", "channel", "sewer", "clog", "blockage", "storm drain", "manhole"],
    icon: "🚰",
    color: "bg-cyan-600/10 text-cyan-600 border-cyan-600/20",
  },
  roadDamage: {
    keywords: ["crack", "road", "surface", "uneven", "broken", "damaged", "construction", "barrier", "gravel"],
    icon: "🛣️",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

interface DetectionResult {
  category: string;
  label: string;
  confidence: number;
  icon: string;
  color: string;
}

interface IssueDetectorProps {
  onDetectionComplete?: (results: DetectionResult[], suggestedCategory: string) => void;
}

const IssueDetector: React.FC<IssueDetectorProps> = ({ onDetectionComplete }) => {
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const analyzeImage = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResults([]);
    setAnalysisComplete(false);

    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const { data, error } = await visionApi.analyzeCivicIssue(imageBase64);
      const detectedIssues: DetectionResult[] = (data?.matches || []).map((match) => ({
        category: match.category,
        label: t(`detection.${match.category}`),
        confidence: match.confidence,
        icon: CIVIC_ISSUE_LABELS[match.category]?.icon || "⚠️",
        color: CIVIC_ISSUE_LABELS[match.category]?.color || "bg-amber-500/10 text-amber-500 border-amber-500/20",
      }));

      if (error || !data?.valid || detectedIssues.length === 0) {
        detectedIssues.push({
          category: "invalid",
          label: data?.reason || error || "Invalid civic issue photo",
          confidence: 0,
          icon: "❌",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
        });
      }

      setResults(detectedIssues);
      setAnalysisComplete(true);

      if (onDetectionComplete && detectedIssues.length > 0 && detectedIssues[0].confidence > 0) {
        onDetectionComplete(detectedIssues, detectedIssues[0].category);
      }

    } catch (err) {
      console.error("ML analysis error:", err);
      setResults([{
        category: "error",
        label: "Analysis failed. Please try again.",
        confidence: 0,
        icon: "❌",
        color: "bg-red-500/10 text-red-500 border-red-500/20",
      }]);
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, [t, onDetectionComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    analyzeImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      analyzeImage(file);
    }
  };

  return (
    <Card className="border border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-600/10 to-blue-600/10 border-b border-border/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-violet-500" />
          {t("detection.title")}
          <Badge variant="outline" className="ml-auto text-xs font-normal bg-violet-500/10 text-violet-400 border-violet-500/30">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
            ${dragOver  ? "border-violet-500 bg-violet-500/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-violet-500/50 hover:bg-violet-500/5"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("ml-photo-upload")?.click()}
        >
          <input
            type="file"
            id="ml-photo-upload"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="mx-auto max-h-48 rounded-lg shadow-md object-cover"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                    <span className="text-white text-sm font-medium">{t("detection.analyzing")}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Camera className="h-7 w-7 text-violet-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Take a photo or upload an image</p>
              <p className="text-xs text-muted-foreground">AI will detect potholes, water leaks, garbage & more</p>
            </div>
          )}
        </div>

        {/* Detection Results */}
        {analysisComplete && results.length > 0 && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              {results[0].category === "invalid" || results[0].category === "error" ? (
                <><AlertTriangle className="h-4 w-4 text-red-500" /> Image not accepted</>
              ) : results[0].confidence > 0 ? (
                <><AlertTriangle className="h-4 w-4 text-amber-500" /> {t("detection.detected")}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /> {t("detection.noIssues")}</>
              )}
            </h4>
            <div className="grid gap-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${result.color} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{result.icon}</span>
                    <span className="font-medium text-sm">{result.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.confidence > 0 && <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all duration-1000"
                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                      />
                    </div>}
                    {result.confidence > 0 && <span className="text-xs font-mono font-bold">{Math.round(result.confidence * 100)}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IssueDetector;
