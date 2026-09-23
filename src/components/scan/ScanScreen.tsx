import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  FileText,
  RotateCcw,
  Sparkles,
  Type,
  HelpCircle,
  ListFilter,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Share2,
  AlertCircle,
  Brain,
  BookOpen,
  ArrowLeft,
  SwitchCamera,
} from "lucide-react";
import { ApiService } from "../../services/api";
import { voiceService } from "../../services/voice";
import { ScanResult } from "../../types";

interface ScanScreenProps {
  onSaveScan: (scan: Omit<ScanResult, "id" | "timestamp">) => void;
  onSaveToMemory?: (text: string) => void;
  onCreateStudyDeck?: (text: string, title?: string) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onSaveScan,
  onSaveToMemory,
  onCreateStudyDeck,
}) => {
  // Mode state: 'select' | 'camera' | 'preview'
  const [mode, setMode] = useState<"select" | "camera" | "preview">("select");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>("image/jpeg");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [showAskInput, setShowAskInput] = useState<boolean>(false);

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Camera stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount or mode switch
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      voiceService.stopSpeaking();
    };
  }, []);

  // Launch live camera
  const startCamera = async () => {
    setErrorMessage(null);
    setMode("camera");
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("[ScanScreen] Camera launch error:", err);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser or select an image from the gallery."
          : "Could not access device camera: " + err.message
      );
      setMode("select");
    }
  };

  // Flip camera between environment (back) and user (front)
  const toggleCameraFacing = async () => {
    stopCameraStream();
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      console.warn("Failed to switch camera", e);
    }
  };

  // Take snap from live video
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      stopCameraStream();
      setSelectedImage(dataUrl);
      setSelectedMimeType("image/jpeg");
      setMode("preview");
      setAnalysisResult(null);
      setErrorMessage(null);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setSelectedMimeType(file.type || "image/jpeg");
      setMode("preview");
      setAnalysisResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Run the requested Vision action
  const executeAction = async (actionType: "ask" | "ocr" | "explain" | "summarize") => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setActiveAction(actionType);
    setErrorMessage(null);
    setAnalysisResult(null);

    const promptToSend = actionType === "ask" ? customPrompt : undefined;

    const res = await ApiService.analyzeImage({
      imageBase64: selectedImage,
      mimeType: selectedMimeType,
      action: actionType,
      prompt: promptToSend,
    });

    setIsAnalyzing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      const output = res.data.result;
      setAnalysisResult(output);

      // Save to scan history
      onSaveScan({
        imageUrl: selectedImage,
        action: actionType,
        prompt: promptToSend,
        output,
        title:
          actionType === "ocr"
            ? "OCR Transcription"
            : actionType === "summarize"
            ? "Executive Summary"
            : actionType === "explain"
            ? "Visual Explanation"
            : customPrompt || "Image Analysis",
      });
    }
  };

  // Copy result
  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Read Aloud / Stop Read Aloud
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else if (analysisResult) {
      setIsSpeaking(true);
      voiceService.speak(analysisResult, {
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  // Reset image
  const handleReset = () => {
    stopCameraStream();
    setSelectedImage(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setCustomPrompt("");
    setShowAskInput(false);
    setMode("select");
  };

  return (
    <div className="flex flex-col pb-28 pt-2 px-4 max-w-md mx-auto min-h-screen">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Scan & Vision</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/50">
              Gemini Vision
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Image, text, and document multi-modal analysis
          </p>
        </div>

        {mode !== "select" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Hidden file pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 mb-4 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Configuration Note</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STEP 1: SELECT SOURCE SCREEN */}
      {mode === "select" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Choose Document or Image Source
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
              Capture documents, textbook pages, hand-written notes, diagrams, or diagrams for OCR extraction and intelligent explanation.
            </p>

            {/* Three Mandated Source Buttons */}
            <div className="grid grid-cols-1 gap-3">
              {/* 1. Camera / Scanner Button */}
              <button
                id="scan-btn-camera"
                onClick={startCamera}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
              >
                <Camera className="w-5 h-5" />
                <span>Camera / Scanner</span>
              </button>

              {/* 2. Gallery Button */}
              <button
                id="scan-btn-gallery"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
              >
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <span>Choose from Gallery</span>
              </button>

              {/* 3. Document Button */}
              <button
                id="scan-btn-document"
                onClick={() => docInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
              >
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Import Document / PDF</span>
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Commercial Scanner Features</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>High-fidelity OCR transcription with line-breaks preserved</li>
              <li>Visual concept explanation for scientific and engineering diagrams</li>
              <li>Synthesizes executive bullet-point summaries in seconds</li>
              <li>Create flashcards directly from scanned study materials</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 2: LIVE CAMERA SCANNER VIEW */}
      {mode === "camera" && (
        <div className="relative rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[420px]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover min-h-[420px]"
          />

          {/* Scanner Viewfinder Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-full aspect-[4/3] max-w-xs border-2 border-dashed border-cyan-400/70 rounded-2xl overflow-hidden">
              {/* Corner accent reticles */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400" />

              {/* Animated Laser Scanning Line */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/50 animate-bounce absolute top-1/2" />
            </div>
          </div>

          {/* Camera Controls Bar */}
          <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between z-20">
            <button
              onClick={() => {
                stopCameraStream();
                setMode("select");
              }}
              className="p-3 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-slate-800"
              title="Cancel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Shutter Capture Button */}
            <button
              id="camera-capture-shutter"
              onClick={captureSnapshot}
              className="w-16 h-16 rounded-full bg-white border-4 border-cyan-400 shadow-xl shadow-cyan-500/30 flex items-center justify-center active:scale-95 transition-transform"
              title="Capture Image"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-500" />
            </button>

            {/* Flip Camera */}
            <button
              onClick={toggleCameraFacing}
              className="p-3 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-slate-800"
              title="Flip Camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW IMAGE & ACTIONS */}
      {mode === "preview" && selectedImage && (
        <div className="space-y-4">
          {/* Image Preview Container */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl max-h-72 flex items-center justify-center group">
            <img
              src={selectedImage}
              alt="Scan preview"
              className="w-full h-full max-h-72 object-contain bg-slate-950"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-slate-800 text-xs flex items-center gap-1 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Ask Anu, Extract Text, Explain, Summarize */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Analysis Action
              </span>
              {isAnalyzing && (
                <span className="text-xs text-cyan-400 font-medium flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Processing...</span>
                </span>
              )}
            </div>

            {/* Grid of the 4 Mandated Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Ask Anu */}
              <button
                id="action-ask-anu"
                disabled={isAnalyzing}
                onClick={() => {
                  setShowAskInput((prev) => !prev);
                  if (showAskInput && customPrompt.trim()) {
                    executeAction("ask");
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                  activeAction === "ask"
                    ? "bg-indigo-950 border-indigo-500 text-indigo-200"
                    : "bg-slate-950/70 border-slate-800 hover:border-indigo-500/50 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-indigo-400">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">Ask Anu</span>
                </div>
                <p className="text-[10px] text-slate-400">Ask any custom question</p>
              </button>

              {/* 2. Extract Text */}
              <button
                id="action-extract-text"
                disabled={isAnalyzing}
                onClick={() => executeAction("ocr")}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                  activeAction === "ocr"
                    ? "bg-cyan-950 border-cyan-500 text-cyan-200"
                    : "bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-cyan-400">
                  <Type className="w-4 h-4" />
                  <span className="text-xs font-bold">Extract Text</span>
                </div>
                <p className="text-[10px] text-slate-400">Accurate OCR transcription</p>
              </button>

              {/* 3. Explain */}
              <button
                id="action-explain"
                disabled={isAnalyzing}
                onClick={() => executeAction("explain")}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                  activeAction === "explain"
                    ? "bg-purple-950 border-purple-500 text-purple-200"
                    : "bg-slate-950/70 border-slate-800 hover:border-purple-500/50 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold">Explain</span>
                </div>
                <p className="text-[10px] text-slate-400">Deep visual concept guide</p>
              </button>

              {/* 4. Summarize */}
              <button
                id="action-summarize"
                disabled={isAnalyzing}
                onClick={() => executeAction("summarize")}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                  activeAction === "summarize"
                    ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-emerald-400">
                  <ListFilter className="w-4 h-4" />
                  <span className="text-xs font-bold">Summarize</span>
                </div>
                <p className="text-[10px] text-slate-400">Executive takeaways</p>
              </button>
            </div>

            {/* If Ask Anu is toggled, show question field */}
            {showAskInput && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300">
                  What would you like Anu to answer about this image?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Solve the equation on line 3, or what plant is this?"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => executeAction("ask")}
                    disabled={isAnalyzing || !customPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results Card */}
          {analysisResult && (
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {activeAction === "ocr"
                      ? "Extracted Text"
                      : activeAction === "summarize"
                      ? "Summary Takeaways"
                      : activeAction === "explain"
                      ? "Detailed Explanation"
                      : "Anu's Answer"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Read Aloud Button */}
                  <button
                    onClick={handleToggleSpeak}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Text"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted Output Area */}
              <div className="text-xs text-slate-200 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap font-sans p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 selection:bg-cyan-500/30">
                {analysisResult}
              </div>

              {/* Secondary actions: Save to Memories, Create Study Deck */}
              <div className="flex items-center gap-2 pt-1">
                {onSaveToMemory && (
                  <button
                    onClick={() => {
                      onSaveToMemory(analysisResult);
                      alert("Saved excerpt to User Memories!");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Save to Memory</span>
                  </button>
                )}

                {onCreateStudyDeck && (
                  <button
                    onClick={() => {
                      onCreateStudyDeck(analysisResult, "Scanned Notes Study Deck");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Make Flashcards</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
