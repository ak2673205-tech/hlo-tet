import React, { useEffect, useState } from "react";
import {
  Wifi,
  Battery,
  SlidersHorizontal,
  Bell,
  Sparkles,
  BookOpen,
  BookMarked,
  Users,
  Smartphone,
} from "lucide-react";
import { UserProfile } from "../../types";

interface HeaderProps {
  profile: UserProfile;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenStudy: () => void;
  onOpenJournal: () => void;
  onOpenContacts?: () => void;
  onOpenDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadNotifications,
  onOpenNotifications,
  onOpenSettings,
  onOpenStudy,
  onOpenJournal,
  onOpenContacts,
  onOpenDownload,
}) => {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800/60 transition-colors">
      {/* Android Status Bar */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[11px] font-medium tracking-tight text-slate-400 select-none">
        <span className="font-semibold text-slate-200">{timeStr || "9:41 AM"}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-400">5G</span>
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono">98%</span>
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Main Top Navigation */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 ring-1 ring-emerald-500/50 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-white">Arushi</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              Your Personal AI Assistant
            </p>
          </div>
        </div>

        {/* Quick Utility Icons */}
        <div className="flex items-center gap-1">
          {/* Contacts & Bridge Quick Modal */}
          {onOpenContacts && (
            <button
              id="header-btn-contacts"
              onClick={onOpenContacts}
              title="Contacts & Android Action Bridge"
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Study Deck Quick Modal */}
          <button
            id="header-btn-study"
            onClick={onOpenStudy}
            title="Study Mode & Flashcards"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-900 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Daily Journal Quick Modal */}
          <button
            id="header-btn-journal"
            onClick={onOpenJournal}
            title="Daily Journal & Mood"
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          {/* Download APK / Install PWA Modal */}
          {onOpenDownload && (
            <button
              id="header-btn-download-apk"
              onClick={onOpenDownload}
              title="Download APK / Install on Phone"
              className="relative p-2 rounded-xl text-cyan-400 hover:text-cyan-200 hover:bg-slate-900 transition-colors bg-cyan-950/40 border border-cyan-800/40"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          {/* Notifications Drawer */}
          <button
            id="header-btn-notifs"
            onClick={onOpenNotifications}
            title="Assistant Notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-950" />
            )}
          </button>

          {/* Settings & PC-Phone Sync Modal */}
          <button
            id="header-btn-settings"
            onClick={onOpenSettings}
            title="Settings & Sync"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
