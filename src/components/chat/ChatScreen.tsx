import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Bot,
  User,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { Message, AssistantTone } from "../../types";
import { voiceService } from "../../services/voice";

interface ChatScreenProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  activeTone: AssistantTone;
  onChangeTone: (tone: AssistantTone) => void;
  isVoiceListening: boolean;
  onToggleVoice: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  activeTone,
  onChangeTone,
  isVoiceListening,
  onToggleVoice,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      voiceService.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      voiceService.speak(text, {
        onEnd: () => setSpeakingId(null),
      });
    }
  };

  const tones: Array<{ id: AssistantTone; label: string }> = [
    { id: "balanced", label: "Balanced" },
    { id: "concise", label: "Concise" },
    { id: "empathetic", label: "Empathetic" },
    { id: "expert", label: "Expert" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] pb-20 max-w-md mx-auto">
      {/* Top Tone & Controls Bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Tone:
          </span>
          {tones.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeTone(t.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeTone === t.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          id="chat-btn-clear"
          onClick={() => {
            if (confirm("Clear current conversation history?")) {
              onClearChat();
            }
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors ml-2 shrink-0"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shrink-0 mt-0.5 shadow-sm">
                  <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm space-y-2 select-text ${
                  isUser
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm"
                    : "bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-sm backdrop-blur-sm"
                }`}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap font-sans break-words">
                  {msg.content}
                </div>

                {/* Bubble Footer / Actions */}
                <div
                  className={`flex items-center justify-between pt-1 text-[10px] ${
                    isUser ? "text-indigo-200" : "text-slate-500 border-t border-slate-800/60"
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                        className="hover:text-cyan-400 transition-colors"
                        title={speakingId === msg.id ? "Stop voice" : "Read aloud"}
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-200 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px]">Anu is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Sticky Chat Input Bar */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-indigo-500/60 shadow-md"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`p-2 rounded-xl transition-colors ${
              isVoiceListening
                ? "bg-rose-600 text-white animate-pulse"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title={isVoiceListening ? "Stop Voice Input" : "Speak to Anu"}
          >
            {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            id="chat-screen-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isVoiceListening
                ? "Listening to voice input..."
                : "Type message or ask Anu..."
            }
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white disabled:opacity-40 transition-opacity"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
