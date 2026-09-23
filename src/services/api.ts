import { AssistantTone, MemoryItem, UserProfile } from "../types";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  isConfigurationNeeded?: boolean;
}

export const ApiService = {
  async checkHealth(): Promise<{ status: string; hasApiKey: boolean }> {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      return await res.json();
    } catch (e: any) {
      console.warn("[ANU API] Server health check failed:", e);
      return { status: "offline", hasApiKey: false };
    }
  },

  async sendChatMessage(params: {
    message: string;
    history: Array<{ role: string; content: string }>;
    userProfile: UserProfile;
    memories: MemoryItem[];
    tone: AssistantTone;
  }): Promise<ApiResponse<{ text: string; actionRequested?: any }>> {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        const isKeyMissing = res.status === 503 || data.error?.includes("GEMINI_API_KEY");
        return {
          error: data.error || "Failed to reach AI service",
          isConfigurationNeeded: isKeyMissing,
        };
      }

      return { data };
    } catch (err: any) {
      return {
        error: "Network error connecting to Anu backend: " + err.message,
      };
    }
  },

  async analyzeImage(params: {
    imageBase64: string;
    mimeType?: string;
    action: "ask" | "ocr" | "explain" | "summarize";
    prompt?: string;
  }): Promise<ApiResponse<{ result: string; action: string }>> {
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        const isKeyMissing = res.status === 503 || data.error?.includes("GEMINI_API_KEY");
        return {
          error: data.error || "Vision analysis failed",
          isConfigurationNeeded: isKeyMissing,
        };
      }

      return { data };
    } catch (err: any) {
      return {
        error: "Failed to send image for vision analysis: " + err.message,
      };
    }
  },

  async generateStudyDeck(params: {
    topic?: string;
    notes?: string;
    count?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const res = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          error: data.error || "Failed to generate study materials",
          isConfigurationNeeded: res.status === 503,
        };
      }

      return { data };
    } catch (err: any) {
      return { error: "Study generator error: " + err.message };
    }
  },

  async reflectOnJournal(params: {
    entry: string;
    mood: string;
    tags?: string[];
  }): Promise<ApiResponse<{ reflection: string }>> {
    try {
      const res = await fetch("/api/journal/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          error: data.error || "Could not generate reflection",
          isConfigurationNeeded: res.status === 503,
        };
      }

      return { data };
    } catch (err: any) {
      return { error: "Journal reflection error: " + err.message };
    }
  },

  async extractMemories(text: string): Promise<ApiResponse<{ memories: any[] }>> {
    try {
      const res = await fetch("/api/memories/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Could not extract memories" };
      }

      return { data };
    } catch (err: any) {
      return { error: err.message };
    }
  },
};
