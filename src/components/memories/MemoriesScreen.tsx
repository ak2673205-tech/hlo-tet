import React, { useState } from "react";
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Lock,
  Sparkles,
  Heart,
  Target,
  Briefcase,
  Activity,
  Sliders,
  Check,
  Edit2,
  X,
} from "lucide-react";
import { MemoryItem, UserProfile } from "../../types";

interface MemoriesScreenProps {
  memories: MemoryItem[];
  profile: UserProfile;
  onAddMemory: (memory: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteMemory: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  memories,
  profile,
  onAddMemory,
  onDeleteMemory,
  onUpdateProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Memory Form State
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryItem["category"]>("personal");
  const [newImportance, setNewImportance] = useState<"high" | "medium" | "low">("medium");

  const categories: Array<{ id: string; label: string; icon: React.ElementType }> = [
    { id: "all", label: "All", icon: Brain },
    { id: "personal", label: "Personal", icon: Heart },
    { id: "preference", label: "Preferences", icon: Sliders },
    { id: "goal", label: "Goals", icon: Target },
    { id: "work", label: "Work & Study", icon: Briefcase },
    { id: "health", label: "Health", icon: Activity },
  ];

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = selectedCategory === "all" || mem.category === selectedCategory;
    const matchesSearch =
      mem.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddMemory({
      category: newCategory,
      text: newText.trim(),
      importance: newImportance,
      source: "manual",
    });

    setNewText("");
    setIsAddModalOpen(false);
  };

  const toggleMemoryRecall = () => {
    onUpdateProfile({
      ...profile,
      allowMemoryRecall: !profile.allowMemoryRecall,
    });
  };

  return (
    <div className="flex flex-col pb-28 pt-2 px-4 max-w-md mx-auto min-h-screen">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>User Memories</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-700/50">
              User-Controlled
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            What Anu remembers to personalize your assistant experience
          </p>
        </div>

        <button
          id="btn-add-memory"
          onClick={() => setIsAddModalOpen(true)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/30 hover:opacity-90 transition-transform active:scale-95 flex items-center gap-1 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Control Banner: Privacy & Recall toggle */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mb-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Personalized Recall
            </span>
            <span className="text-[11px] text-slate-400">
              {profile.allowMemoryRecall
                ? "Anu references these facts during chat"
                : "Memory recall is paused for privacy"}
            </span>
          </div>
        </div>

        <button
          onClick={toggleMemoryRecall}
          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
            profile.allowMemoryRecall ? "bg-purple-600" : "bg-slate-700"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              profile.allowMemoryRecall ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved memories and preferences..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Memories List */}
      <div className="space-y-2.5">
        {filteredMemories.length > 0 ? (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="group p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/30 transition-all flex items-start justify-between gap-3 shadow-sm"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800/50">
                    {mem.category}
                  </span>
                  {mem.importance === "high" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800/50">
                      High Priority
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {new Date(mem.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {mem.text}
                </p>
              </div>

              <button
                onClick={() => onDeleteMemory(mem.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-80 group-hover:opacity-100"
                title="Delete memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-2">
            <Brain className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              {searchQuery
                ? "No memories match your search."
                : "No memories saved yet in this category."}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              + Add a new memory fact
            </button>
          </div>
        )}
      </div>

      {/* ADD MEMORY MODAL / DRAWER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Add Personal Memory</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["personal", "preference", "goal", "work", "health"] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                          newCategory === cat
                            ? "bg-purple-600 text-white font-semibold"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  What should Anu remember about you?
                </label>
                <textarea
                  required
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Preparing for Systems Design exam in October, or I prefer morning workouts."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Importance Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["high", "medium", "low"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewImportance(lvl)}
                      className={`py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-colors ${
                        newImportance === lvl
                          ? "bg-purple-950 border border-purple-500 text-purple-300 font-bold"
                          : "bg-slate-950 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 disabled:opacity-40"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
