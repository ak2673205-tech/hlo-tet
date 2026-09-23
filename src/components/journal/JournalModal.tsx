import React, { useState } from "react";
import {
  BookMarked,
  X,
  Smile,
  Sparkles,
  Calendar,
  Tag,
  Send,
  Heart,
  AlertCircle,
} from "lucide-react";
import { JournalEntry } from "../../types";
import { ApiService } from "../../services/api";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSaveEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
}) => {
  const [mood, setMood] = useState<JournalEntry["mood"]>("calm");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["Productivity", "Mindfulness"]);
  const [isReflecting, setIsReflecting] = useState(false);
  const [currentReflection, setCurrentReflection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const moodOptions: Array<{
    id: JournalEntry["mood"];
    label: string;
    emoji: string;
    color: string;
  }> = [
    { id: "ecstatic", label: "Ecstatic", emoji: "⚡", color: "text-amber-400 border-amber-500/50 bg-amber-950/40" },
    { id: "happy", label: "Happy", emoji: "😊", color: "text-emerald-400 border-emerald-500/50 bg-emerald-950/40" },
    { id: "calm", label: "Calm", emoji: "🌿", color: "text-cyan-400 border-cyan-500/50 bg-cyan-950/40" },
    { id: "tired", label: "Tired", emoji: "🌙", color: "text-indigo-400 border-indigo-500/50 bg-indigo-950/40" },
    { id: "anxious", label: "Anxious", emoji: "🌊", color: "text-purple-400 border-purple-500/50 bg-purple-950/40" },
    { id: "frustrated", label: "Frustrated", emoji: "🔥", color: "text-rose-400 border-rose-500/50 bg-rose-950/40" },
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsReflecting(true);
    setError(null);

    // Call AI reflection endpoint
    const reflectRes = await ApiService.reflectOnJournal({
      entry: content,
      mood,
      tags,
    });

    const reflection = reflectRes.data?.reflection || undefined;
    setCurrentReflection(reflection || null);
    setIsReflecting(false);

    onSaveEntry({
      date: new Date().toISOString().split("T")[0],
      mood,
      content,
      tags,
      aiReflection: reflection,
    });

    setContent("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-700/50">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Daily Journal & Mood</h3>
              <p className="text-[10px] text-slate-400">Personal reflections & AI mindfulness</p>
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
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* New Entry Form */}
          <form onSubmit={handleSaveEntry} className="space-y-4">
            {/* Mood selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-2">
                How are you feeling right now?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {moodOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMood(opt.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      mood === opt.id
                        ? `${opt.color} ring-2 ring-cyan-400/30 scale-[1.02]`
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content text */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Reflect on your thoughts
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What went well today? Any challenges, feelings, or ideas on your mind?"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tags & Themes
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add custom tag (press enter)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isReflecting || !content.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 disabled:opacity-40 transition-transform active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isReflecting ? "Anu is reflecting..." : "Save Entry & Get AI Reflection"}</span>
            </button>
          </form>

          {/* AI Reflection Feedback Callout */}
          {currentReflection && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-700/50 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Anu's Reflection
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{currentReflection}"
              </p>
            </div>
          )}

          {/* Past Entries Timeline */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Past Entries ({entries.length})
            </h4>
            <div className="space-y-2.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {entry.date}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-cyan-400">
                      {entry.mood}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{entry.content}</p>

                  {entry.aiReflection && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-indigo-300 italic">
                      <span className="font-bold not-italic text-slate-400 block mb-0.5">
                        Anu:
                      </span>
                      {entry.aiReflection}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
