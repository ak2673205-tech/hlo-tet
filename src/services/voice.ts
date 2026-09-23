import { androidBridge } from "./androidBridge";

export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface VoiceServiceCallbacks {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: "idle" | "listening" | "thinking" | "speaking") => void;
  onToolCall?: (calls: ToolCallItem[]) => void;
  onActionExecuted?: (action: string, result: any) => void;
}

class GeminiLiveVoiceManager {
  private ws: WebSocket | null = null;
  private isListening: boolean = false;
  private isConnected: boolean = false;
  private callbacks: VoiceServiceCallbacks = {};

  // Audio recording
  private mediaStream: MediaStream | null = null;
  private recordAudioContext: AudioContext | null = null;
  private recordProcessor: ScriptProcessorNode | null = null;
  private recordSource: MediaStreamAudioSourceNode | null = null;

  // Audio playback (24kHz for Gemini Live)
  private playAudioContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isSpeaking: boolean = false;

  constructor() {
    // Lazy initialize on user gesture
  }

  public setCallbacks(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
  }

  public isVoiceActive(): boolean {
    return this.isListening;
  }

  // Standalone speech helper for UI text read-aloud (e.g. ScanScreen document reader)
  public speak(
    text: string,
    options?: { pitch?: number; rate?: number; onEnd?: () => void }
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (options?.onEnd) options.onEnd();
      return;
    }
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    if (options?.pitch) utterance.pitch = options.pitch;
    if (options?.rate) utterance.rate = options.rate;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (options?.onEnd) options.onEnd();
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      if (options?.onEnd) options.onEnd();
    };

    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.stopCurrentPlayback();
  }

  // Ensure 24kHz audio playback context is active
  private getPlayContext(): AudioContext {
    if (!this.playAudioContext || this.playAudioContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.playAudioContext = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.playAudioContext.currentTime;
    }
    if (this.playAudioContext.state === "suspended") {
      this.playAudioContext.resume();
    }
    return this.playAudioContext;
  }

  // Connect WebSocket to Gemini Live backend
  private async connectWebSocket(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/live`;

    return new Promise((resolve, reject) => {
      console.log("[LiveVoice] Connecting to:", url);
      const socket = new WebSocket(url);

      const timeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          reject(new Error("Gemini Live connection timed out."));
        }
      }, 8000);

      socket.onopen = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.ws = socket;
        console.log("[LiveVoice] WebSocket connected");
        resolve(socket);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.error("[LiveVoice] Failed to parse message:", err);
        }
      };

      socket.onerror = (err) => {
        clearTimeout(timeout);
        console.warn("[LiveVoice] WebSocket error:", err);
        if (this.callbacks.onError) {
          this.callbacks.onError("Voice server connection error.");
        }
        reject(err);
      };

      socket.onclose = () => {
        this.isConnected = false;
        console.log("[LiveVoice] WebSocket closed");
        this.stopListening();
      };
    });
  }

  // Handle messages received from server Gemini Live session
  private handleServerMessage(msg: any) {
    if (msg.type === "session_ready") {
      console.log(`[LiveVoice] Arushi voice session ready (${msg.voice})`);
    } else if (msg.type === "audio" && msg.audio) {
      // 24kHz raw PCM chunk
      this.playPcmChunk(msg.audio);
    } else if (msg.type === "interrupted") {
      console.log("[LiveVoice] Model speech interrupted by user");
      this.stopCurrentPlayback();
      if (this.callbacks.onStateChange) this.callbacks.onStateChange("listening");
    } else if (msg.type === "model_text" && msg.text) {
      if (this.callbacks.onTranscript) {
        this.callbacks.onTranscript(msg.text, true);
      }
    } else if (msg.type === "tool_call" && msg.calls) {
      this.handleToolCalls(msg.calls);
    } else if (msg.type === "error") {
      console.error("[LiveVoice] Server error:", msg.message);
      if (this.callbacks.onError) {
        this.callbacks.onError(msg.message);
      }
    }
  }

  // Playback 24kHz 16-bit little-endian PCM audio
  private playPcmChunk(base64Audio: string) {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit signed PCM to float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioCtx = this.getPlayContext();
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      // Gapless scheduling
      const startTime = Math.max(audioCtx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;

      this.activeSources.push(source);
      this.isSpeaking = true;
      if (this.callbacks.onStateChange) this.callbacks.onStateChange("speaking");

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);

        if (this.activeSources.length === 0) {
          this.isSpeaking = false;
          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(this.isListening ? "listening" : "idle");
          }
        }
      };
    } catch (e) {
      console.error("[LiveVoice] Audio playback decode error:", e);
    }
  }

  // Stop currently playing audio buffers
  private stopCurrentPlayback() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore
      }
    });
    this.activeSources = [];
    this.isSpeaking = false;
    if (this.playAudioContext) {
      this.nextPlayTime = this.playAudioContext.currentTime;
    }
  }

  // Execute Tool Calls sent by Gemini Live (openWhatsApp, openApp, makeCall, callContact, openUrl)
  private async handleToolCalls(calls: ToolCallItem[]) {
    if (this.callbacks.onToolCall) {
      this.callbacks.onToolCall(calls);
    }

    for (const call of calls) {
      console.log("[LiveVoice] Executing tool call:", call.name, call.args);
      let result: any = { success: false, message: "Unknown action" };

      switch (call.name) {
        case "openWhatsApp":
          result = androidBridge.openWhatsApp(call.args?.message, call.args?.phoneNumber);
          break;
        case "openApp":
          result = androidBridge.openApp(call.args?.appName || "");
          break;
        case "openUrl":
          result = androidBridge.openUrl(call.args?.url || "");
          break;
        case "makeCall":
          result = androidBridge.makeCall(call.args?.phoneNumber || "");
          break;
        case "callContact":
          result = androidBridge.callContact(call.args?.contactName || "");
          break;
        default:
          result = { success: false, message: `Action ${call.name} is not supported.` };
      }

      console.log("[LiveVoice] Action result:", result);
      if (this.callbacks.onActionExecuted) {
        this.callbacks.onActionExecuted(call.name, result);
      }

      // Send tool response back to Gemini Live
      this.sendToolResponse(call.id, call.name, result);
    }
  }

  // Send tool execution response to server -> Gemini Live
  public sendToolResponse(callId: string, name: string, response: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "tool_response",
          id: callId,
          name,
          response,
        })
      );
    }
  }

  // Start microphone streaming to Gemini Live
  public async startListening(): Promise<boolean> {
    try {
      // 1. Establish WebSocket connection to Gemini Live
      await this.connectWebSocket();

      // 2. Initialize microphone recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone input is not supported in this browser.");
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.recordAudioContext = new AudioCtx({ sampleRate: 16000 });
      this.recordSource = this.recordAudioContext.createMediaStreamSource(this.mediaStream);

      // Buffer size 2048 at 16000Hz = ~128ms chunks
      this.recordProcessor = this.recordAudioContext.createScriptProcessor(2048, 1, 1);

      this.recordProcessor.onaudioprocess = (e) => {
        if (!this.isListening || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        // Convert Float32 [-1.0, 1.0] to 16-bit PCM signed integer
        const pcm16 = new Int16Array(inputChannelData.length);
        for (let i = 0; i < inputChannelData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannelData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        this.ws.send(
          JSON.stringify({
            type: "audio",
            audio: base64,
          })
        );
      };

      this.recordSource.connect(this.recordProcessor);
      this.recordProcessor.connect(this.recordAudioContext.destination);

      this.isListening = true;
      if (this.callbacks.onStateChange) this.callbacks.onStateChange("listening");
      return true;
    } catch (err: any) {
      console.error("[LiveVoice] Start error:", err);
      this.isListening = false;
      if (this.callbacks.onStateChange) this.callbacks.onStateChange("idle");
      if (this.callbacks.onError) {
        this.callbacks.onError(
          err.name === "NotAllowedError"
            ? "Microphone access blocked. Please enable microphone permission in browser settings."
            : err.message || "Failed to start microphone."
        );
      }
      return false;
    }
  }

  // Stop listening and audio capture
  public stopListening(): void {
    this.isListening = false;

    if (this.recordProcessor) {
      this.recordProcessor.disconnect();
      this.recordProcessor = null;
    }
    if (this.recordSource) {
      this.recordSource.disconnect();
      this.recordSource = null;
    }
    if (this.recordAudioContext && this.recordAudioContext.state !== "closed") {
      this.recordAudioContext.close();
      this.recordAudioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.isSpeaking ? "speaking" : "idle");
    }
  }

  public toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  // Text message into Live session
  public sendTextMessage(text: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "text", text }));
      if (this.callbacks.onStateChange) this.callbacks.onStateChange("thinking");
      return true;
    }
    return false;
  }

  // Clean shutdown
  public close(): void {
    this.stopListening();
    this.stopCurrentPlayback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const voiceService = new GeminiLiveVoiceManager();
