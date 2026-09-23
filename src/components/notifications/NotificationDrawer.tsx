import React from "react";
import { Bell, X, Check, BookOpen, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import { AppNotification } from "../../types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-top duration-200">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Assistant Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Mark read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const iconMap = {
                study: BookOpen,
                memory: Brain,
                insight: Sparkles,
                reminder: CheckCircle2,
              }[n.type] || Sparkles;
              const Icon = iconMap;

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-colors flex items-start gap-3 ${
                    n.read
                      ? "bg-slate-950/40 border-slate-800/60 text-slate-400"
                      : "bg-slate-950 border-indigo-500/40 text-slate-200 shadow-sm"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-900 text-indigo-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No notifications right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
