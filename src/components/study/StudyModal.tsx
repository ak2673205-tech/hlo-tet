import React, { useState } from "react";
import {
  BookOpen,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCw,
  Plus,
  HelpCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { StudyDeck, Flashcard } from "../../types";
import { ApiService } from "../../services/api";

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: StudyDeck[];
  onSaveDeck: (deck: Omit<StudyDeck, "id" | "createdAt">) => void;
  initialDeckTopic?: string;
  initialDeckNotes?: string;
}

export const StudyModal: React.FC<StudyModalProps> = ({
  isOpen,
  onClose,
  decks,
  onSaveDeck,
  initialDeckTopic,
  initialDeckNotes,
}) => {
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);
  const [mode, setMode] = useState<"flashcards" | "quiz" | "create">("flashcards");

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Create deck state
  const [newTopic, setNewTopic] = useState(initialDeckTopic || "");
  const [newNotes, setNewNotes] = useState(initialDeckNotes || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDeck = decks[selectedDeckIndex] || decks[0];
  const flashcards = currentDeck?.flashcards || [];
  const currentCard = flashcards[cardIndex];

  const quiz = currentDeck?.quiz || [];
  const currentQuiz = quiz[quizIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() && !newNotes.trim()) return;

    setIsGenerating(true);
    setGenError(null);

    const res = await ApiService.generateStudyDeck({
      topic: newTopic,
      notes: newNotes,
    });

    setIsGenerating(false);

    if (res.error) {
      setGenError(res.error);
    } else if (res.data) {
      const generated = res.data;
      onSaveDeck({
        topic: generated.topic || newTopic || "Study Deck",
        summary: generated.summary || "AI-generated study deck",
        flashcards: generated.flashcards?.map((fc: any, i: number) => ({
          id: `fc-${Date.now()}-${i}`,
          front: fc.front,
          back: fc.back,
        })) || [],
        quiz: generated.quiz?.map((q: any, i: number) => ({
          id: `qz-${Date.now()}-${i}`,
          question: q.question,
          options: q.options || [],
          correctIndex: q.correctIndex ?? 0,
          explanation: q.explanation || "",
        })) || [],
        keyTakeaways: generated.keyTakeaways || [],
      });

      setSelectedDeckIndex(0);
      setCardIndex(0);
      setIsFlipped(false);
      setMode("flashcards");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-700/50">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Study Mode</h3>
              <p className="text-[10px] text-slate-400">
                AI Flashcards & Knowledge Quizzes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Flashcards | Quiz | Generate */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 border-b border-slate-800/60 bg-slate-950/20">
          <button
            onClick={() => setMode("flashcards")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              mode === "flashcards"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Flashcards ({flashcards.length})
          </button>
          <button
            onClick={() => {
              setMode("quiz");
              setQuizIndex(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              mode === "quiz"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Quiz ({quiz.length})
          </button>
          <button
            onClick={() => setMode("create")}
            className={`ml-auto px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
              mode === "create"
                ? "bg-cyan-600 text-white"
                : "text-cyan-400 hover:bg-slate-800"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Deck selector if multiple decks exist */}
          {mode !== "create" && decks.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {decks.map((deck, idx) => (
                <button
                  key={deck.id}
                  onClick={() => {
                    setSelectedDeckIndex(idx);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedDeckIndex === idx
                      ? "bg-slate-800 text-indigo-300 border border-indigo-500/50"
                      : "text-slate-400 bg-slate-950 hover:bg-slate-800"
                  }`}
                >
                  {deck.topic}
                </button>
              ))}
            </div>
          )}

          {/* MODE 1: FLASHCARDS */}
          {mode === "flashcards" && currentCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">{currentDeck.topic}</span>
                <span>
                  Card {cardIndex + 1} of {flashcards.length}
                </span>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[220px] rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-indigo-500/30 p-6 flex flex-col justify-between cursor-pointer shadow-xl hover:border-indigo-500/60 transition-all select-none active:scale-[0.99]"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <span>{isFlipped ? "Answer / Explanation" : "Question / Concept"}</span>
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                </div>

                <div className="my-auto text-center py-4">
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                </div>

                <div className="text-center text-[11px] text-slate-500">
                  Tap card to {isFlipped ? "show question" : "flip answer"}
                </div>
              </div>

              {/* Card Navigation Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrevCard}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      currentCard.knewIt = false;
                      handleNextCard();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Review Again</span>
                  </button>
                  <button
                    onClick={() => {
                      currentCard.knewIt = true;
                      handleNextCard();
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Got It</span>
                  </button>
                </div>

                <button
                  onClick={handleNextCard}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Next Card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: INTERACTIVE QUIZ */}
          {mode === "quiz" && (
            <div className="space-y-4">
              {currentQuiz ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-white">Quiz Question</span>
                    <span>
                      {quizIndex + 1} of {quiz.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-100 leading-relaxed">
                      {currentQuiz.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuiz.options.map((opt, i) => {
                      const isChosen = selectedAnswer === i;
                      const isCorrect = i === currentQuiz.correctIndex;
                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800";

                      if (showExplanation) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (isChosen && !isCorrect) {
                          btnStyle = "bg-rose-950 border-rose-500 text-rose-200";
                        }
                      } else if (isChosen) {
                        btnStyle = "bg-indigo-950 border-indigo-500 text-indigo-200 font-semibold";
                      }

                      return (
                        <button
                          key={i}
                          disabled={showExplanation}
                          onClick={() => {
                            setSelectedAnswer(i);
                            setShowExplanation(true);
                          }}
                          className={`w-full p-3 rounded-xl border text-xs text-left transition-colors flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showExplanation && isCorrect && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {showExplanation && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="font-semibold text-indigo-400 block">Explanation:</span>
                      <p>{currentQuiz.explanation}</p>
                    </div>
                  )}

                  {showExplanation && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setSelectedAnswer(null);
                          setShowExplanation(false);
                          setQuizIndex((prev) => (prev + 1) % quiz.length);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Next Question →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No quiz questions generated for this deck yet.
                </p>
              )}
            </div>
          )}

          {/* MODE 3: GENERATE DECK WITH GEMINI */}
          {mode === "create" && (
            <form onSubmit={handleGenerateDeck} className="space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-white mb-1">
                  Generate Study Deck with Gemini
                </h4>
                <p className="text-[11px] text-slate-400">
                  Enter a topic or paste lecture notes/scanned text to produce instant flashcards & quiz.
                </p>
              </div>

              {genError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs">
                  {genError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Subject or Topic
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Mitochondria & Cellular Respiration, or Microservices"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Source Notes / Scanned Text (Optional)
                </label>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Paste study material, summaries, or text extracted from document scanner..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !newTopic.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? "Synthesizing with Gemini..." : "Generate Study Bundle"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
