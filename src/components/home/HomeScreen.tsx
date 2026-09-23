import React, { useState } from "react";
import {
  ScanLine,
  Mic,
  MicOff,
  BookOpen,
  BookMarked,
  Send,
  Brain,
  FileText,
  CheckCircle2,
  Smile,
  ChevronRight,
  Lightbulb,
  Smartphone,
  Download,
} from "lucide-react";
import { CompanionOrb } from "../common/CompanionOrb";
import {
  CompanionState,
  NavigationTab,
  UserProfile,
  MemoryItem,
  ScanResult,
  StudyDeck,
} from "../../types";

interface HomeScreenProps {
  profile: UserProfile;
  companionState: CompanionState;
  onSetCompanionState: (state: CompanionState) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  isVoiceListening: boolean;
  onOpenStudy: () => void;
  onOpenJournal: () => void;
  onOpenDownload?: () => void;
  recentMemories: MemoryItem[];
  recentScans: ScanResult[];
  studyDecks: StudyDeck[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  companionState,
  onNavigateTab,
  onSendMessage,
  onToggleVoice,
  isVoiceListening,
  onOpenStudy,
  onOpenJournal,
  onOpenDownload,
  recentMemories,
  recentScans,
  studyDecks,
}) => {
  const [chatInput, setChatInput] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const quickPrompts = [
    "Open WhatsApp",
    "Call Mummy",
    "Open YouTube",
    "Arushi, kaisi ho? (Hindi)",
    "Scan notes with camera",
    "What do you remember about me?",
  ];

  const pendingFlashcardsCount = studyDecks.reduce(
    (acc, d) => acc + d.flashcards.filter((f) => !f.knewIt).length,
    0
  );

  return (
    <div className="flex flex-col pb-28 space-y-6 pt-2 px-4 max-w-md mx-auto">
      {/* 1. Greeting Section */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            {getGreeting()}
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {profile.name || "Friend"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Arushi is active with Gemini Live voice & Android Action Bridge.
          </p>
        </div>

        {/* Quick Mood Pill */}
        <button
          onClick={onOpenJournal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors shadow-sm"
        >
          <Smile className="w-3.5 h-3.5 text-amber-400" />
          <span>Log Mood</span>
        </button>
      </div>

      {/* APK / Mobile Install Banner */}
      {onOpenDownload && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-500/30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Download Phone App (APK)</p>
              <p className="text-[10px] text-slate-300">Android APK & 1-tap Home Screen install</p>
            </div>
          </div>
          <button
            onClick={onOpenDownload}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
        </div>
      )}

      {/* 2. Large AI Companion Area */}
      <div className="relative p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-xl overflow-hidden text-center backdrop-blur-sm">
        {/* Soft atmospheric background glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <CompanionOrb
          state={companionState}
          onTap={onToggleVoice}
          size="lg"
          statusMessage={
            isVoiceListening
              ? "Listening to Arushi Live... speak in any language"
              : companionState === "thinking"
              ? "Arushi is thinking..."
              : companionState === "speaking"
              ? "Arushi speaking..."
              : "Tap orb to speak with Arushi"
          }
        />

        {/* Assistant Thought / Insight Bubble */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left shadow-inner">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Arushi Insight
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            "I'm ready with real-time multilingual voice (Hindi, Hinglish, English, etc.), Android app control (WhatsApp, calls, YouTube), document scanning, and memory vault. Say 'WhatsApp kholo' or 'Call Mom'."
          </p>
        </div>
      </div>

      {/* 3. Quick Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Scan & Vision */}
          <button
            id="quick-action-scan"
            onClick={() => onNavigateTab("scan")}
            className="group p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-200 text-left relative overflow-hidden shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/40 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <ScanLine className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              Scan & OCR
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Extract, Explain & Summarize
            </p>
          </button>

          {/* Card 2: Voice Mode */}
          <button
            id="quick-action-voice"
            onClick={onToggleVoice}
            className={`group p-3.5 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden shadow-sm active:scale-[0.98] ${
              isVoiceListening
                ? "bg-rose-950/50 border-rose-600/60 ring-2 ring-rose-500/20"
                : "bg-gradient-to-br from-slate-900 to-slate-900/80 border-slate-800/90 hover:border-rose-500/40"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform ${
                isVoiceListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-rose-950/80 border border-rose-700/40 text-rose-400"
              }`}
            >
              {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
              {isVoiceListening ? "Voice Active" : "Voice Assistant"}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              {isVoiceListening ? "Listening now..." : "Speak naturally"}
            </p>
          </button>

          {/* Card 3: Study Mode */}
          <button
            id="quick-action-study"
            onClick={onOpenStudy}
            className="group p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 transition-all duration-200 text-left relative overflow-hidden shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
              Study Mode
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Flashcards & AI Quizzes
            </p>
          </button>

          {/* Card 4: Daily Journal */}
          <button
            id="quick-action-journal"
            onClick={onOpenJournal}
            className="group p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all duration-200 text-left relative overflow-hidden shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookMarked className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              Daily Journal
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Reflections & Mood Tracker
            </p>
          </button>
        </div>
      </div>

      {/* 4. Information Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assistant Feed & Information
          </h3>
        </div>

        {/* Info Card 1: Today's Focus */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Today's Focus & Study</span>
            </div>
            <button
              onClick={onOpenStudy}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
            >
              <span>Open</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You have <strong className="text-white font-semibold">{pendingFlashcardsCount} flashcards</strong> due
            in <span className="text-indigo-300">Neural Networks Fundamentals</span>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onOpenStudy}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-colors"
            >
              Start 3-Min Review
            </button>
          </div>
        </div>

        {/* Info Card 2: User-Controlled Memory Recall */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-950 text-purple-400">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Active Memories Vault</span>
            </div>
            <button
              onClick={() => onNavigateTab("memories")}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5"
            >
              <span>{recentMemories.length} Memories</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {recentMemories.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-300 italic">
                "{recentMemories[0].text}"
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 uppercase font-semibold">
                  {recentMemories[0].category}
                </span>
                <span>• Anu recalls this to personalize conversations</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              No memories recorded yet. Anu extracts preferences as you chat.
            </p>
          )}
        </div>

        {/* Info Card 3: Recent Document / Scan Activity */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Recent Scan & Document</span>
            </div>
            <button
              onClick={() => onNavigateTab("scan")}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
            >
              <span>Scan New</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {recentScans.length > 0 ? (
            <div className="flex items-center gap-3">
              <img
                src={recentScans[0].imageUrl}
                alt="Recent scan"
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  {recentScans[0].action.toUpperCase()}
                </span>
                <p className="text-xs text-slate-300 truncate">
                  {recentScans[0].output.slice(0, 70)}...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Scan textbooks, invoices, diagrams or hand-written notes.</span>
              <button
                onClick={() => onNavigateTab("scan")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium"
              >
                Scan Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                onSendMessage(prompt);
                onNavigateTab("chat");
              }}
              className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-xs font-medium whitespace-nowrap transition-colors shrink-0 active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Chat Input & 6. Large Microphone Button */}
      <div className="space-y-3 pt-2">
        {/* Chat input pill */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md focus-within:border-cyan-500/50 transition-colors"
        >
          <input
            id="home-chat-input"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Anu anything or type a prompt..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white disabled:opacity-40 disabled:pointer-events-none hover:opacity-90 transition-opacity"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* 6. Prominent Large Microphone Button */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="relative">
            {/* Pulsing rings when listening */}
            {isVoiceListening && (
              <span className="absolute -inset-2.5 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            )}
            <button
              id="home-large-mic-btn"
              onClick={onToggleVoice}
              title={isVoiceListening ? "Stop Listening" : "Tap to Speak with Anu"}
              className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 active:scale-95 ${
                isVoiceListening
                  ? "bg-rose-600 text-white ring-4 ring-rose-500/40 shadow-rose-600/50"
                  : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-indigo-500/40 hover:scale-105"
              }`}
            >
              {isVoiceListening ? (
                <MicOff className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-2 tracking-wide">
            {isVoiceListening ? "Listening... Tap to end" : "Tap to Speak with Anu"}
          </span>
        </div>
      </div>
    </div>
  );
};
