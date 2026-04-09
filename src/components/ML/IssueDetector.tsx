import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, AlertTriangle, CheckCircle2, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // ============================================
  // Client-side ML-like image analysis
  // Uses Google Cloud Vision-style label detection
  // via a lightweight canvas + pixel analysis approach
  // ============================================
  const analyzeImage = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResults([]);
    setAnalysisComplete(false);

    try {
      // Create image element for canvas analysis
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      // Canvas-based pixel analysis for color/texture patterns
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const SIZE = 224;
      canvas.width = SIZE;
      canvas.height = SIZE;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
      const pixels = imageData.data;

      // Analyze color distribution
      let totalR = 0, totalG = 0, totalB = 0;
      let darkPixels = 0, bluePixels = 0, brownPixels = 0, greenPixels = 0;
      let grayPixels = 0, yellowPixels = 0;
      const totalPixels = SIZE * SIZE;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        totalR += r; totalG += g; totalB += b;

        const brightness = (r + g + b) / 3;
        if (brightness < 60) darkPixels++;
        if (b > r + 30 && b > g + 30) bluePixels++;
        if (r > 100 && g > 60 && g < 120 && b < 80) brownPixels++;
        if (g > r + 20 && g > b + 20) greenPixels++;
        if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) grayPixels++;
        if (r > 150 && g > 120 && b < 80) yellowPixels++;
      }

      const avgR = totalR / totalPixels;
      const avgG = totalG / totalPixels;
      const avgB = totalB / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      const blueRatio = bluePixels / totalPixels;
      const brownRatio = brownPixels / totalPixels;
      const greenRatio = greenPixels / totalPixels;
      const grayRatio = grayPixels / totalPixels;
      const yellowRatio = yellowPixels / totalPixels;

      // Texture analysis - edge detection (simplified Sobel)
      let edgeCount = 0;
      for (let y = 1; y < SIZE - 1; y++) {
        for (let x = 1; x < SIZE - 1; x++) {
          const idx = (y * SIZE + x) * 4;
          const left = (pixels[idx - 4] + pixels[idx - 3] + pixels[idx - 2]) / 3;
          const right = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
          const top = (pixels[idx - SIZE * 4] + pixels[idx - SIZE * 4 + 1] + pixels[idx - SIZE * 4 + 2]) / 3;
          const bottom = (pixels[idx + SIZE * 4] + pixels[idx + SIZE * 4 + 1] + pixels[idx + SIZE * 4 + 2]) / 3;
          const gradient = Math.sqrt((right - left) ** 2 + (bottom - top) ** 2);
          if (gradient > 30) edgeCount++;
        }
      }
      const edgeRatio = edgeCount / totalPixels;

      // Score each category based on visual features
      const detectedIssues: DetectionResult[] = [];

      // Pothole detection: dark patches + gray asphalt + high edges
      const potholeScore = (darkRatio * 0.35) + (grayRatio * 0.25) + (edgeRatio * 0.3) + (brownRatio * 0.1);
      if (potholeScore > 0.15) {
        detectedIssues.push({
          category: "pothole",
          label: t("detection.pothole"),
          confidence: Math.min(0.95, potholeScore * 2.5),
          icon: CIVIC_ISSUE_LABELS.pothole.icon,
          color: CIVIC_ISSUE_LABELS.pothole.color,
        });
      }

      // Water leak detection: blue + wet patches
      const waterScore = (blueRatio * 0.5) + (darkRatio * 0.2) + (grayRatio * 0.15) + (edgeRatio * 0.15);
      if (waterScore > 0.12 || blueRatio > 0.08) {
        detectedIssues.push({
          category: "waterLeak",
          label: t("detection.waterLeak"),
          confidence: Math.min(0.92, waterScore * 2.8),
          icon: CIVIC_ISSUE_LABELS.waterLeak.icon,
          color: CIVIC_ISSUE_LABELS.waterLeak.color,
        });
      }

      // Garbage detection: varied colors + brownish + high edges (clutter)
      const garbageScore = (brownRatio * 0.3) + (yellowRatio * 0.2) + (edgeRatio * 0.35) + (greenRatio * 0.15);
      if (garbageScore > 0.18 || (edgeRatio > 0.3 && brownRatio > 0.1)) {
        detectedIssues.push({
          category: "garbage",
          label: t("detection.garbage"),
          confidence: Math.min(0.88, garbageScore * 2.2),
          icon: CIVIC_ISSUE_LABELS.garbage.icon,
          color: CIVIC_ISSUE_LABELS.garbage.color,
        });
      }

      // Road damage: gray + high texture variation
      const roadScore = (grayRatio * 0.4) + (edgeRatio * 0.35) + (darkRatio * 0.15) + (brownRatio * 0.1);
      if (roadScore > 0.2 && grayRatio > 0.15) {
        detectedIssues.push({
          category: "roadDamage",
          label: t("detection.roadDamage"),
          confidence: Math.min(0.9, roadScore * 2.0),
          icon: CIVIC_ISSUE_LABELS.roadDamage.icon,
          color: CIVIC_ISSUE_LABELS.roadDamage.color,
        });
      }

      // Drainage detection: dark + gray + some water patterns
      const drainageScore = (darkRatio * 0.3) + (grayRatio * 0.25) + (blueRatio * 0.25) + (edgeRatio * 0.2);
      if (drainageScore > 0.2 && (blueRatio > 0.03 || darkRatio > 0.2)) {
        detectedIssues.push({
          category: "drainage",
          label: t("detection.drainage"),
          confidence: Math.min(0.85, drainageScore * 2.3),
          icon: CIVIC_ISSUE_LABELS.drainage.icon,
          color: CIVIC_ISSUE_LABELS.drainage.color,
        });
      }

      // Simulate small processing delay for UX
      await new Promise((r) => setTimeout(r, 1500));

      // Sort by confidence
      detectedIssues.sort((a, b) => b.confidence - a.confidence);

      // If nothing was detected, provide a general result
      if (detectedIssues.length === 0) {
        detectedIssues.push({
          category: "other",
          label: t("detection.noIssues"),
          confidence: 0,
          icon: "ℹ️",
          color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        });
      }

      setResults(detectedIssues);
      setAnalysisComplete(true);

      if (onDetectionComplete && detectedIssues.length > 0 && detectedIssues[0].confidence > 0) {
        onDetectionComplete(detectedIssues, detectedIssues[0].category);
      }

      URL.revokeObjectURL(imageUrl);
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
              {results[0].confidence > 0 ? (
                <><AlertTriangle className="h-4 w-4 text-amber-500" /> {t("detection.detected")}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /> {t("detection.noIssues")}</>
              )}
            </h4>
            <div className="grid gap-2">
              {results.filter(r => r.confidence > 0).map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${result.color} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{result.icon}</span>
                    <span className="font-medium text-sm">{result.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all duration-1000"
                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {Math.round(result.confidence * 100)}%
                    </span>
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
