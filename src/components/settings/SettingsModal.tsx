import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  X,
  Smartphone,
  Monitor,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Trash2,
  Check,
  QrCode,
  Key,
  Cpu,
  Sparkles,
} from "lucide-react";
import { UserProfile, AssistantTone } from "../../types";
import { StorageService } from "../../services/storage";
import { ApiService } from "../../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onRefreshAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onRefreshAllData,
}) => {
  const [name, setName] = useState(profile.name);
  const [preferredTone, setPreferredTone] = useState<AssistantTone>(profile.preferredTone);
  const [voiceRate, setVoiceRate] = useState(profile.voiceRate);
  const [voicePitch, setVoicePitch] = useState(profile.voicePitch);
  const [copiedSync, setCopiedSync] = useState(false);
  const [backupJson, setBackupJson] = useState<string>("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<{ status: string; hasApiKey: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      ApiService.checkHealth().then((health) => setApiHealth(health));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || "Friend",
      preferredTone,
      voiceRate,
      voicePitch,
    };
    onUpdateProfile(updated);
    onClose();
  };

  const handleExport = () => {
    const json = StorageService.exportBackup();
    setBackupJson(json);

    // Also trigger file download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anu-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = StorageService.importBackup(text);
      if (success) {
        setImportStatus("Database restored successfully! Refreshing data...");
        onRefreshAllData();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus("Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleCopySyncCode = () => {
    navigator.clipboard.writeText(profile.syncCode);
    setCopiedSync(true);
    setTimeout(() => setCopiedSync(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Assistant Settings</h3>
              <p className="text-[10px] text-slate-400">Profile, voice, and device sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Assistant Tone */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Default Conversation Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["balanced", "concise", "empathetic", "expert"] as AssistantTone[]).map(
                  (tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setPreferredTone(tone)}
                      className={`p-2 rounded-xl border text-left capitalize transition-colors ${
                        preferredTone === tone
                          ? "bg-indigo-950 border-indigo-500 text-indigo-200 font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {tone}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Voice Pitch and Speech Rate Sliders */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">Speech Rate</span>
                  <span className="text-slate-400">{voiceRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">Voice Pitch</span>
                  <span className="text-slate-400">{voicePitch}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Save Profile Preferences
            </button>
          </form>

          {/* Section: PC ↔ Phone Architecture */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <Monitor className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                PC ↔ Phone Architecture
              </h4>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pair your Android phone with your PC desktop browser to synchronize your memory vault, study decks, and journal entries across screens.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Device Identifier
                  </span>
                  <span className="font-mono text-xs text-slate-200">{profile.deviceId}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">6-Digit Pairing Code</span>
                  <span className="text-base font-mono font-bold tracking-widest text-cyan-400">
                    {profile.syncCode}
                  </span>
                </div>
                <button
                  onClick={handleCopySyncCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                >
                  {copiedSync ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <span>Copy Code</span>
                  )}
                </button>
              </div>

              {/* QR / Sync visual simulation */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
                <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-[10px] text-slate-400">
                  Scan code on PC at <strong className="text-slate-300">anu.ai/sync</strong> to mirror session
                </p>
              </div>
            </div>

            {/* Export & Import Data */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Local Database & Cloud Sync Backup
              </span>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-200 text-xs">
                  {importStatus}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Backup</span>
                </button>

                <label className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Backup</span>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section: Gemini Engine Status */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs">Gemini AI Engine</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  apiHealth?.hasApiKey
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                    : "bg-amber-950 text-amber-300 border border-amber-800/50"
                }`}
              >
                {apiHealth?.hasApiKey ? "Connected" : "Key Config Needed"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {apiHealth?.hasApiKey
                ? "Full-stack Gemini 3.8 Flash pipeline is operational."
                : "Configure GEMINI_API_KEY in AI Studio Settings > Secrets to activate live model execution."}
            </p>
          </div>

          {/* Section: Reset Local Data */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reset all local data (chat, journal, memories)? This will restore default seeds."
                  )
                ) {
                  StorageService.resetAllData();
                  onRefreshAllData();
                  onClose();
                }
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset all local application storage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
