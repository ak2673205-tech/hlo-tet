import React from "react";
import { Home, ScanLine, Brain, MessageSquare } from "lucide-react";
import { NavigationTab } from "../../types";

interface BottomNavProps {
  activeTab: NavigationTab;
  onChangeTab: (tab: NavigationTab) => void;
  unreadChatCount?: number;
  memoryCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount = 0,
}) => {
  const tabs: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "scan", label: "Scan", icon: ScanLine },
    { id: "memories", label: "Memories", icon: Brain },
    { id: "chat", label: "Chat", icon: MessageSquare, badge: unreadChatCount },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/70 max-w-md mx-auto"
    >
      <div className="flex items-center justify-around px-2 py-1.5 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`group relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              {/* Active Glow Pill */}
              <div
                className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-950">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? "text-slate-100 font-semibold" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
