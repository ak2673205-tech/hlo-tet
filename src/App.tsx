import React, { useState, useEffect, useCallback } from "react";
import {
  NavigationTab,
  CompanionState,
  UserProfile,
  Message,
  MemoryItem,
  JournalEntry,
  ScanResult,
  StudyDeck,
  AppNotification,
  AssistantTone,
  Contact,
} from "./types";
import { StorageService } from "./services/storage";
import { ApiService } from "./services/api";
import { voiceService } from "./services/voice";
import { androidBridge, ActionResult } from "./services/androidBridge";

import { Header } from "./components/common/Header";
import { BottomNav } from "./components/common/BottomNav";
import { SplashScreen } from "./components/splash/SplashScreen";
import { HomeScreen } from "./components/home/HomeScreen";
import { ScanScreen } from "./components/scan/ScanScreen";
import { MemoriesScreen } from "./components/memories/MemoriesScreen";
import { ChatScreen } from "./components/chat/ChatScreen";
import { StudyModal } from "./components/study/StudyModal";
import { JournalModal } from "./components/journal/JournalModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { NotificationDrawer } from "./components/notifications/NotificationDrawer";
import { ContactsModal } from "./components/contacts/ContactsModal";
import { ActionBanner } from "./components/common/ActionBanner";
import { ApkDownloadModal } from "./components/common/ApkDownloadModal";

export default function App() {
  // Splash sequence state
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return sessionStorage.getItem("anu_splash_dismissed") !== "true";
  });

  // App Navigation & State
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");
  const [companionState, setCompanionState] = useState<CompanionState>("idle");
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Modals state
  const [isStudyOpen, setIsStudyOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  // Android Action Bridge & Call Safety State
  const [contacts, setContacts] = useState<Contact[]>(() => androidBridge.getContacts());
  const [lastAction, setLastAction] = useState<{
    action: string;
    result: ActionResult;
    timestamp: number;
  } | null>(null);

  // Persistent Domain Data
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [chatHistory, setChatHistory] = useState<Message[]>(() => StorageService.getChatHistory());
  const [memories, setMemories] = useState<MemoryItem[]>(() => StorageService.getMemories());
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    StorageService.getJournalEntries()
  );
  const [scans, setScans] = useState<ScanResult[]>(() => StorageService.getScans());
  const [studyDecks, setStudyDecks] = useState<StudyDeck[]>(() => StorageService.getStudyDecks());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    StorageService.getNotifications()
  );

  // Reload everything from storage
  const handleRefreshAllData = useCallback(() => {
    setProfile(StorageService.getProfile());
    setChatHistory(StorageService.getChatHistory());
    setMemories(StorageService.getMemories());
    setJournalEntries(StorageService.getJournalEntries());
    setScans(StorageService.getScans());
    setStudyDecks(StorageService.getStudyDecks());
    setNotifications(StorageService.getNotifications());
    setContacts(androidBridge.getContacts());
  }, []);

  // Voice Service Integration with Gemini Live & Function Calling
  useEffect(() => {
    voiceService.setCallbacks({
      onTranscript: (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          // If Gemini Live produces final text transcription, append to chat history
          const liveMsg: Message = {
            id: "msg-live-" + Date.now(),
            role: "assistant",
            content: transcript.trim(),
            timestamp: Date.now(),
          };
          setChatHistory((prev) => StorageService.appendMessage(liveMsg));
        }
      },
      onError: (err) => {
        console.warn("[Voice] Error:", err);
        setIsVoiceListening(false);
        setCompanionState("idle");
      },
      onStateChange: (state) => {
        setCompanionState(state);
        setIsVoiceListening(state === "listening");
      },
      onActionExecuted: (action, result) => {
        // Display animated notification banner for tool execution & call safety
        setLastAction({
          action,
          result,
          timestamp: Date.now(),
        });

        // Add action execution log to chat history
        const actionNotice: Message = {
          id: "action-" + Date.now(),
          role: "assistant",
          content: `⚡ **Action: ${action}**\n${result.message}`,
          timestamp: Date.now(),
        };
        setChatHistory((prev) => StorageService.appendMessage(actionNotice));
      },
    });
  }, []);

  // Handle voice toggle
  const handleToggleVoice = useCallback(() => {
    if (isVoiceListening) {
      voiceService.stopListening();
      setIsVoiceListening(false);
      setCompanionState("idle");
    } else {
      voiceService.startListening();
    }
  }, [isVoiceListening]);

  // Send message to Gemini chat (typed or prompt buttons)
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Append user message
    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedHistory = StorageService.appendMessage(userMsg);
    setChatHistory(updatedHistory);
    setIsChatLoading(true);
    setCompanionState("thinking");

    // 2. Call Gemini Chat endpoint
    const historyPayload = updatedHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await ApiService.sendChatMessage({
      message: text,
      history: historyPayload,
      userProfile: profile,
      memories: profile.allowMemoryRecall ? memories : [],
      tone: profile.preferredTone,
    });

    setIsChatLoading(false);

    if (response.data) {
      const assistantText = response.data.text;
      const assistantMsg: Message = {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
      };

      const finalHistory = StorageService.appendMessage(assistantMsg);
      setChatHistory(finalHistory);
      setCompanionState("idle");

      // Check if server identified a tool action
      if (response.data.actionRequested) {
        const req = response.data.actionRequested;
        let actionResult: ActionResult | null = null;

        if (req.name === "openWhatsApp") {
          actionResult = androidBridge.openWhatsApp(req.args?.message, req.args?.phoneNumber);
        } else if (req.name === "openApp") {
          actionResult = androidBridge.openApp(req.args?.appName);
        } else if (req.name === "makeCall") {
          actionResult = androidBridge.makeCall(req.args?.phoneNumber);
        } else if (req.name === "callContact") {
          actionResult = androidBridge.callContact(req.args?.contactName);
        } else if (req.name === "openUrl") {
          actionResult = androidBridge.openUrl(req.args?.url);
        }

        if (actionResult) {
          setLastAction({
            action: req.name,
            result: actionResult,
            timestamp: Date.now(),
          });
        }
      }

      // Background automatic memory extraction
      ApiService.extractMemories(text).then((memRes) => {
        if (memRes.data?.memories && memRes.data.memories.length > 0) {
          memRes.data.memories.forEach((m: any) => {
            if (m.text) {
              StorageService.addMemory({
                category: m.category || "personal",
                text: m.text,
                importance: m.importance || "medium",
                source: "chat_extracted",
              });
              setMemories(StorageService.getMemories());
            }
          });
        }
      });
    } else {
      // Show fallback message explaining configuration if needed
      const errorMsg: Message = {
        id: "msg-" + Date.now(),
        role: "assistant",
        content:
          response.error ||
          "I couldn't reach the AI service right now. Please verify your GEMINI_API_KEY in Settings > Secrets.",
        timestamp: Date.now(),
      };
      setChatHistory(StorageService.appendMessage(errorMsg));
      setCompanionState("idle");
    }
  };

  const handleClearChat = () => {
    StorageService.clearChat();
    setChatHistory(StorageService.getChatHistory());
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    StorageService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleAddMemory = (item: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">) => {
    StorageService.addMemory(item);
    setMemories(StorageService.getMemories());
  };

  const handleDeleteMemory = (id: string) => {
    StorageService.deleteMemory(id);
    setMemories(StorageService.getMemories());
  };

  const handleSaveScan = (scan: Omit<ScanResult, "id" | "timestamp">) => {
    StorageService.addScan(scan);
    setScans(StorageService.getScans());
  };

  const handleSaveJournalEntry = (entry: Omit<JournalEntry, "id" | "timestamp">) => {
    StorageService.addJournalEntry(entry);
    setJournalEntries(StorageService.getJournalEntries());
  };

  const handleSaveStudyDeck = (deck: Omit<StudyDeck, "id" | "createdAt">) => {
    StorageService.addStudyDeck(deck);
    setStudyDecks(StorageService.getStudyDecks());
  };

  const handleDismissSplash = () => {
    sessionStorage.setItem("anu_splash_dismissed", "true");
    setShowSplash(false);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-indigo-500 selection:text-white">
      {/* 1. Splash Screen */}
      {showSplash && <SplashScreen onDismiss={handleDismissSplash} />}

      {/* 2. Main Mobile Frame Layout */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 flex flex-col relative shadow-2xl border-x border-slate-900">
        {/* Top Header & Status Bar */}
        <Header
          profile={profile}
          unreadNotifications={unreadNotifsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStudy={() => setIsStudyOpen(true)}
          onOpenJournal={() => setIsJournalOpen(true)}
          onOpenContacts={() => setIsContactsOpen(true)}
          onOpenDownload={() => setIsDownloadOpen(true)}
        />

        {/* Action Execution Banner / Call Safety Banner */}
        <ActionBanner
          lastAction={lastAction}
          onDismiss={() => setLastAction(null)}
        />

        {/* Active Tab View */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === "home" && (
            <HomeScreen
              profile={profile}
              companionState={companionState}
              onSetCompanionState={setCompanionState}
              onNavigateTab={setActiveTab}
              onSendMessage={handleSendMessage}
              onToggleVoice={handleToggleVoice}
              isVoiceListening={isVoiceListening}
              onOpenStudy={() => setIsStudyOpen(true)}
              onOpenJournal={() => setIsJournalOpen(true)}
              onOpenDownload={() => setIsDownloadOpen(true)}
              recentMemories={memories}
              recentScans={scans}
              studyDecks={studyDecks}
            />
          )}

          {activeTab === "scan" && (
            <ScanScreen
              onSaveScan={handleSaveScan}
              onSaveToMemory={(text) => {
                handleAddMemory({
                  category: "personal",
                  text: text.slice(0, 200),
                  importance: "medium",
                  source: "scan",
                });
              }}
              onCreateStudyDeck={(text, title) => {
                setIsStudyOpen(true);
              }}
            />
          )}

          {activeTab === "memories" && (
            <MemoriesScreen
              memories={memories}
              profile={profile}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === "chat" && (
            <ChatScreen
              messages={chatHistory}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              isLoading={isChatLoading}
              activeTone={profile.preferredTone}
              onChangeTone={(tone: AssistantTone) => {
                handleUpdateProfile({ ...profile, preferredTone: tone });
              }}
              isVoiceListening={isVoiceListening}
              onToggleVoice={handleToggleVoice}
            />
          )}
        </main>

        {/* Bottom Navigation Dock */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          memoryCount={memories.length}
        />

        {/* 3. Modals & Drawers */}
        <ContactsModal
          isOpen={isContactsOpen}
          onClose={() => setIsContactsOpen(false)}
          contacts={contacts}
          onUpdateContacts={setContacts}
          onTriggerCall={(contact) => {
            const res = androidBridge.makeCall(contact.phone);
            setLastAction({
              action: "makeCall",
              result: res,
              timestamp: Date.now(),
            });
          }}
        />

        <StudyModal
          isOpen={isStudyOpen}
          onClose={() => setIsStudyOpen(false)}
          decks={studyDecks}
          onSaveDeck={handleSaveStudyDeck}
        />

        <JournalModal
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          entries={journalEntries}
          onSaveEntry={handleSaveJournalEntry}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onRefreshAllData={handleRefreshAllData}
        />

        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={() => {
            StorageService.markNotificationsRead();
            setNotifications(StorageService.getNotifications());
          }}
        />

        <ApkDownloadModal
          isOpen={isDownloadOpen}
          onClose={() => setIsDownloadOpen(false)}
        />
      </div>
    </div>
  );
}
