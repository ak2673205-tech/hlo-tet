import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Mic, Eye } from "lucide-react";

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-slate-100 selection:bg-indigo-500 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-32 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Android App Info */}
      <div className="w-full flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-slate-400">
            SYSTEM READY
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
          v1.0
        </span>
      </div>

      {/* Center Branded Identity */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Animated Central Core */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-indigo-500/20 via-transparent to-transparent animate-pulse" />
              <Sparkles className="w-12 h-12 text-cyan-400 relative z-10" />
            </div>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl -z-10" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          ANU
        </h1>
        <p className="text-base text-slate-300 font-medium tracking-normal mb-1">
          "Your Personal AI Assistant"
        </p>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Powered by Gemini • Vision • Voice • Memory Vault • Study Mode
        </p>

        {/* Commercial Capability Badges */}
        <div className="grid grid-cols-2 gap-2 mt-8 w-full max-w-xs text-left">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Multi-modal Scan</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <Mic className="w-4 h-4 text-rose-400" />
            <span>Voice Companion</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Personal Memories</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local Vault Sync</span>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="w-full max-w-xs flex flex-col items-center pb-6">
        <button
          id="splash-btn-start"
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Open Anu Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-slate-500 mt-3">
          Initializing personal environment{dots}
        </p>
      </div>
    </div>
  );
};
