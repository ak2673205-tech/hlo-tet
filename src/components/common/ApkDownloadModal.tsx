import React, { useState } from "react";
import {
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  X,
  Github,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"phone" | "github">("phone");

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ais-pre-u5z24hyrnrwntx5qfww4l3-783390787489.asia-southeast1.run.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Download & Install ANU App</h3>
              <p className="text-[11px] text-slate-400">Android Phone APK & Web App Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("phone")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "phone"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Direct Install (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab("github")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "github"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub APK Build</span>
          </button>
        </div>

        {/* Tab 1: Instant Phone Install */}
        {activeTab === "phone" && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instant Android Installation (No build required)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aap is app ko direct apne phone par install kar sakte hain. Full-screen Android app ki tarah chalegi with Live Voice, WhatsApp & Camera access!
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Apne Phone me ye link kholein</p>
                  <p className="text-slate-400 text-[11px] font-mono break-all mt-0.5 select-all bg-slate-900 p-1.5 rounded border border-slate-800">
                    {currentUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Chrome Browser me 3 dots (⋮) dabayein</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Right corner me menu kholiye aur <strong>"Add to Home screen"</strong> ya <strong>"Install App"</strong> par tap karein.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-200">App ready ho jayegi!</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Aapke phone ke home screen par ANU icon ban jayega aur aap offline/online voice assistant use kar sakte hain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GitHub Actions APK Workflow */}
        {activeTab === "github" && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>GitHub Actions APK Generator Configured</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Workflow file <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> successfully create kar di gayi hai jo temporary keystore se APK build karegi.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                  Export Project to GitHub
                </p>
                <p className="text-[11px] text-slate-400">
                  AI Studio ke top right menu (Gear icon) se <strong>Export to GitHub</strong> karein.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                  Automatic Build Trigger
                </p>
                <p className="text-[11px] text-slate-400">
                  GitHub par push hote hi Actions workflow Gradle se <code className="text-slate-300">app-debug.apk</code> build karega.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                  Download from GitHub Releases
                </p>
                <p className="text-[11px] text-slate-400">
                  Releases page par <code className="text-emerald-300 font-mono">.apk</code> file direct phone par download karne ke liye available hogi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Theek hai, Samajh gaya
          </button>
        </div>
      </div>
    </div>
  );
};
