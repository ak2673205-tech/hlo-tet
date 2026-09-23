import React from "react";
import {
  Phone,
  MessageCircle,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { ActionResult } from "../../services/androidBridge";

interface ActionBannerProps {
  lastAction: {
    action: string;
    result: ActionResult;
    timestamp: number;
  } | null;
  onDismiss: () => void;
  onConfirmCall?: (phoneNumber: string) => void;
}

export const ActionBanner: React.FC<ActionBannerProps> = ({
  lastAction,
  onDismiss,
  onConfirmCall,
}) => {
  if (!lastAction) return null;

  const { action, result } = lastAction;

  const getIcon = () => {
    switch (action) {
      case "openWhatsApp":
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case "makeCall":
      case "callContact":
        return <Phone className="w-5 h-5 text-cyan-400" />;
      default:
        return <ExternalLink className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Arushi Action
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                    result.success
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-amber-950 text-amber-300 border border-amber-800"
                  }`}
                >
                  {result.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-100 mt-0.5 leading-snug">
                {result.message}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If calling: Show direct dialer trigger / confirmation */}
        {(action === "makeCall" || action === "callContact") && result.details?.phoneNumber && (
          <div className="mt-1 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-300 text-[11px]">
              {result.details.phoneNumber}
            </span>
            <a
              href={`tel:${result.details.phoneNumber}`}
              className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Open Dialer</span>
            </a>
          </div>
        )}

        {/* If multiple matches found: show quick contact options */}
        {result.status === "multiple_matches" && result.details?.matches && (
          <div className="mt-1 pt-2 border-t border-slate-800 flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Select which contact to call:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.details.matches.map((m: any, idx: number) => (
                <a
                  key={idx}
                  href={`tel:${m.phone}`}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium hover:bg-indigo-900 transition-colors flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-indigo-400" />
                  <span>{m.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
