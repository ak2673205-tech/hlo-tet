import {
  UserProfile,
  Message,
  MemoryItem,
  JournalEntry,
  ScanResult,
  StudyDeck,
  AppNotification,
} from "../types";

const STORAGE_KEYS = {
  PROFILE: "anu_user_profile_v1",
  CHAT_HISTORY: "anu_chat_history_v1",
  MEMORIES: "anu_memories_v1",
  JOURNAL: "anu_journal_v1",
  SCANS: "anu_scans_v1",
  STUDY_DECKS: "anu_study_decks_v1",
  NOTIFICATIONS: "anu_notifications_v1",
  SYNC_META: "anu_sync_meta_v1",
};

// Default profile
const defaultProfile: UserProfile = {
  name: "Alex",
  tagline: "Lifelong learner & builder",
  preferredTone: "balanced",
  voiceEnabled: true,
  voicePitch: 1.0,
  voiceRate: 1.05,
  allowMemoryRecall: true,
  theme: "dark",
  notificationsEnabled: true,
  deviceId: "ANU-ANDR-9842X",
  syncCode: "749-182",
};

// Initial welcome chat messages
const defaultChatHistory: Message[] = [
  {
    id: "msg-welcome-1",
    role: "assistant",
    content: "Hi Alex! I'm **ANU**, your personal AI assistant. I'm connected to live vision, voice, study tools, and your personal memory vault. Tap the camera to scan notes or documents, or ask me anything.",
    timestamp: Date.now() - 3600000,
  },
];

// Initial user memories
const defaultMemories: MemoryItem[] = [
  {
    id: "mem-1",
    category: "goal",
    text: "Preparing for the Systems Design certification exam next month.",
    importance: "high",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    source: "manual",
  },
  {
    id: "mem-2",
    category: "preference",
    text: "Prefers concise, bulleted explanations for technical queries and audio playback when walking.",
    importance: "medium",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    source: "manual",
  },
  {
    id: "mem-3",
    category: "personal",
    text: "Lives in San Francisco, drinks Earl Grey tea in the morning.",
    importance: "low",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    source: "chat_extracted",
  },
];

// Initial sample journal entry
const defaultJournal: JournalEntry[] = [
  {
    id: "jnl-1",
    date: new Date().toISOString().split("T")[0],
    timestamp: Date.now() - 7200000,
    mood: "calm",
    content: "Started the morning reviewing system architectures. Feeling clear-headed and ready to tackle the new project milestones.",
    tags: ["Productivity", "Focus", "Learning"],
    aiReflection: "It sounds like you have created a serene and intentional start to your day. Capitalize on that morning mental clarity!",
  },
];

// Initial default study deck
const defaultStudyDecks: StudyDeck[] = [
  {
    id: "deck-1",
    topic: "Neural Networks Fundamentals",
    summary: "Essential principles of activation functions, backpropagation, and gradient descent.",
    createdAt: Date.now() - 86400000,
    flashcards: [
      {
        id: "fc-1",
        front: "What is Backpropagation?",
        back: "An algorithm that computes the gradient of the loss function with respect to weights using the chain rule, enabling neural networks to learn.",
        knewIt: true,
      },
      {
        id: "fc-2",
        front: "Why use ReLU over Sigmoid?",
        back: "ReLU avoids the vanishing gradient problem in deep layers and is computationally very fast to evaluate.",
      },
      {
        id: "fc-3",
        front: "What does Dropout do during training?",
        back: "Randomly deactivates a fraction of neurons during training passes to prevent co-adaptation and combat overfitting.",
      },
    ],
    quiz: [
      {
        id: "qz-1",
        question: "Which component prevents vanishing gradients most effectively in deep networks?",
        options: ["Sigmoid Activation", "ReLU or Leaky ReLU", "Increasing Learning Rate", "Softmax on input"],
        correctIndex: 1,
        explanation: "ReLU has a constant gradient of 1 for positive inputs, preventing gradient degradation.",
      },
    ],
    keyTakeaways: [
      "Gradient descent optimizes parameters iteratively.",
      "Activation functions introduce non-linearity necessary for complex pattern recognition.",
      "Regularization prevents model overfitting on limited training sets.",
    ],
  },
];

// Initial proactive notifications
const defaultNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "Daily Focus Check-in",
    body: "Good evening! Ready to review your 3 pending flashcards from Neural Networks?",
    time: "10m ago",
    type: "study",
    read: false,
  },
  {
    id: "notif-2",
    title: "Memory Vault Updated",
    body: "Anu stored your preference: 'Prefers bulleted technical explanations'.",
    time: "2h ago",
    type: "memory",
    read: false,
  },
];

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[ANU Storage] Failed to read key ${key}:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[ANU Storage] Failed to write key ${key}:`, e);
  }
}

export const StorageService = {
  getProfile(): UserProfile {
    return safeGet<UserProfile>(STORAGE_KEYS.PROFILE, defaultProfile);
  },

  saveProfile(profile: UserProfile): void {
    safeSet(STORAGE_KEYS.PROFILE, profile);
  },

  getChatHistory(): Message[] {
    return safeGet<Message[]>(STORAGE_KEYS.CHAT_HISTORY, defaultChatHistory);
  },

  saveChatHistory(history: Message[]): void {
    safeSet(STORAGE_KEYS.CHAT_HISTORY, history);
  },

  appendMessage(msg: Message): Message[] {
    const current = this.getChatHistory();
    const updated = [...current, msg];
    this.saveChatHistory(updated);
    return updated;
  },

  clearChat(): void {
    this.saveChatHistory([
      {
        id: "msg-fresh-" + Date.now(),
        role: "assistant",
        content: "Chat cleared! How can I assist you right now?",
        timestamp: Date.now(),
      },
    ]);
  },

  getMemories(): MemoryItem[] {
    return safeGet<MemoryItem[]>(STORAGE_KEYS.MEMORIES, defaultMemories);
  },

  saveMemories(memories: MemoryItem[]): void {
    safeSet(STORAGE_KEYS.MEMORIES, memories);
  },

  addMemory(memory: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">): MemoryItem {
    const current = this.getMemories();
    const newItem: MemoryItem = {
      ...memory,
      id: "mem-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.saveMemories([newItem, ...current]);
    return newItem;
  },

  deleteMemory(id: string): void {
    const current = this.getMemories();
    this.saveMemories(current.filter((m) => m.id !== id));
  },

  getJournalEntries(): JournalEntry[] {
    return safeGet<JournalEntry[]>(STORAGE_KEYS.JOURNAL, defaultJournal);
  },

  saveJournalEntries(entries: JournalEntry[]): void {
    safeSet(STORAGE_KEYS.JOURNAL, entries);
  },

  addJournalEntry(entry: Omit<JournalEntry, "id" | "timestamp">): JournalEntry {
    const current = this.getJournalEntries();
    const newItem: JournalEntry = {
      ...entry,
      id: "jnl-" + Date.now(),
      timestamp: Date.now(),
    };
    this.saveJournalEntries([newItem, ...current]);
    return newItem;
  },

  getScans(): ScanResult[] {
    return safeGet<ScanResult[]>(STORAGE_KEYS.SCANS, []);
  },

  saveScans(scans: ScanResult[]): void {
    safeSet(STORAGE_KEYS.SCANS, scans);
  },

  addScan(scan: Omit<ScanResult, "id" | "timestamp">): ScanResult {
    const current = this.getScans();
    const newItem: ScanResult = {
      ...scan,
      id: "scan-" + Date.now(),
      timestamp: Date.now(),
    };
    this.saveScans([newItem, ...current].slice(0, 30)); // retain last 30 scans
    return newItem;
  },

  getStudyDecks(): StudyDeck[] {
    return safeGet<StudyDeck[]>(STORAGE_KEYS.STUDY_DECKS, defaultStudyDecks);
  },

  saveStudyDecks(decks: StudyDeck[]): void {
    safeSet(STORAGE_KEYS.STUDY_DECKS, decks);
  },

  addStudyDeck(deck: Omit<StudyDeck, "id" | "createdAt">): StudyDeck {
    const current = this.getStudyDecks();
    const newItem: StudyDeck = {
      ...deck,
      id: "deck-" + Date.now(),
      createdAt: Date.now(),
    };
    this.saveStudyDecks([newItem, ...current]);
    return newItem;
  },

  getNotifications(): AppNotification[] {
    return safeGet<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, defaultNotifications);
  },

  markNotificationsRead(): void {
    const current = this.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // Export full snapshot for Cloud Sync / PC-Phone transfer
  exportBackup(): string {
    const payload = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      profile: this.getProfile(),
      chatHistory: this.getChatHistory(),
      memories: this.getMemories(),
      journal: this.getJournalEntries(),
      scans: this.getScans(),
      studyDecks: this.getStudyDecks(),
      checksum: "ANU-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    };
    return JSON.stringify(payload, null, 2);
  },

  // Import snapshot from cloud/file/PC
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.chatHistory) this.saveChatHistory(data.chatHistory);
      if (data.memories) this.saveMemories(data.memories);
      if (data.journal) this.saveJournalEntries(data.journal);
      if (data.scans) this.saveScans(data.scans);
      if (data.studyDecks) this.saveStudyDecks(data.studyDecks);
      return true;
    } catch (e) {
      console.error("[ANU Storage] Failed to parse backup file:", e);
      return false;
    }
  },

  resetAllData(): void {
    localStorage.clear();
  },
};
