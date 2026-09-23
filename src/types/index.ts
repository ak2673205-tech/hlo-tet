export type NavigationTab = "home" | "scan" | "memories" | "chat";

export type CompanionState = "idle" | "listening" | "thinking" | "speaking";

export type AssistantTone = "balanced" | "concise" | "empathetic" | "expert";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  imageUrl?: string;
  actionTaken?: string;
}

export interface MemoryItem {
  id: string;
  category: "personal" | "preference" | "goal" | "relationship" | "work" | "health";
  text: string;
  importance: "high" | "medium" | "low";
  createdAt: number;
  updatedAt: number;
  source?: "manual" | "chat_extracted" | "scan";
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  mood: "ecstatic" | "happy" | "calm" | "tired" | "anxious" | "frustrated";
  content: string;
  tags: string[];
  aiReflection?: string;
}

export interface ScanResult {
  id: string;
  imageUrl: string;
  timestamp: number;
  action: "ask" | "ocr" | "explain" | "summarize";
  prompt?: string;
  output: string;
  title?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  knewIt?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex?: number;
}

export interface StudyDeck {
  id: string;
  topic: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  keyTakeaways: string[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  tagline: string;
  preferredTone: AssistantTone;
  voiceEnabled: boolean;
  voicePitch: number;
  voiceRate: number;
  allowMemoryRecall: boolean;
  theme: "dark" | "oled" | "system";
  notificationsEnabled: boolean;
  deviceId: string;
  syncCode: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "insight" | "reminder" | "study" | "memory";
  read: boolean;
}

export interface Contact {
  id: string;
  name: string;
  aliases: string[];
  phone: string;
  relationship?: string;
}

export interface ActionExecutionEvent {
  id: string;
  action: string;
  status: "executed" | "fallback_opened" | "contact_not_found" | "multiple_matches" | "unsupported";
  message: string;
  details?: any;
  timestamp: number;
}
