import express from "express";
import http from "http";
import path from "path";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25MB limit for high-res images and document scans
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy GoogleGenAI client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Predefined safe function declarations for device app control & calling
const ARUSHI_TOOL_DECLARATIONS: any[] = [
  {
    name: "openWhatsApp",
    description:
      "Opens WhatsApp on the user's mobile device or computer. Triggered by requests like 'Open WhatsApp', 'WhatsApp kholo', 'WhatsApp open karo', 'Send message on WhatsApp'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: {
          type: Type.STRING,
          description: "Optional pre-filled message text to send.",
        },
        phoneNumber: {
          type: Type.STRING,
          description: "Optional recipient phone number.",
        },
      },
    },
  },
  {
    name: "openApp",
    description:
      "Opens an installed or web application on the device such as YouTube, Instagram, Chrome, Settings, Camera, Maps, Spotify, Calculator, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            "The name of the application to open, e.g. 'YouTube', 'Instagram', 'Chrome', 'Settings', 'Camera'.",
        },
      },
      required: ["appName"],
    },
  },
  {
    name: "openUrl",
    description: "Opens a specific website URL in the browser.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "The full URL to open, e.g. 'https://www.google.com'.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "makeCall",
    description:
      "Initiates a phone call or launches the device dialer with the given phone number. Triggered by 'Call <number>' or 'Phone lagao <number>'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phoneNumber: {
          type: Type.STRING,
          description: "The phone number to dial, e.g. '9876543210'.",
        },
      },
      required: ["phoneNumber"],
    },
  },
  {
    name: "callContact",
    description:
      "Looks up a person in contacts by their name or relation (e.g. 'Mom', 'Mummy', 'Rahul', 'Dad', 'Pooja') and dials their number. Used for 'Call Mom', 'Rahul ko call karo', 'Mummy ko phone lagao'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactName: {
          type: Type.STRING,
          description:
            "The name or relation of the contact to call, e.g. 'Mom', 'Mummy', 'Rahul', 'Dad'.",
        },
      },
      required: ["contactName"],
    },
  },
];

const ARUSHI_LIVE_SYSTEM_INSTRUCTION = `You are Arushi, an intelligent, empathetic, and highly capable personal mobile AI companion and assistant.

PERSONALITY & VOICE:
- Your name is Arushi. You are warm, respectful, articulate, and genuinely helpful.
- For spoken voice conversations, keep your answers concise, clear, and natural (1-3 sentences) suitable for real-time speech.

MULTI-LANGUAGE VOICE RULES:
- You natively understand and speak naturally in all Indian and global languages supported by Gemini Live: Hindi, English, Hinglish, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, and more.
- CRITICAL: Automatically detect the language being spoken by the user.
  - If the user speaks Hindi, respond in fluent, natural Hindi.
  - If the user speaks English, respond in natural English.
  - If the user speaks Hinglish (e.g., "WhatsApp open karo", "Mummy ko call lagao", "Kaisi ho Arushi?"), respond naturally in Hinglish.
  - If the user speaks Marathi, Gujarati, Bengali, Tamil, Telugu, etc., respond in that respective language.
  - If the user switches languages mid-conversation, seamlessly switch to their language immediately without missing a beat.
- Never ask the user to manually select or configure their language.

APP CONTROL & FUNCTION CALLING:
You have tools to perform real device actions. When the user asks you to perform an action, YOU MUST CALL THE CORRESPONDING TOOL.
- For WhatsApp:
  - "Open WhatsApp", "WhatsApp kholo", "WhatsApp open karo", "Open my WhatsApp" -> call openWhatsApp()
- For other apps (YouTube, Instagram, Chrome, Camera, Settings, etc.):
  - "Open YouTube", "YouTube kholo", "Open Instagram", "Open Chrome", "Open Camera", "Open Settings" -> call openApp(appName: ...)
- For numeric phone calls:
  - "Call 9876543210", "Phone lagao 9876543210" -> call makeCall(phoneNumber: "9876543210")
- For calling a contact by name:
  - "Call Mom", "Call Mummy", "Mummy ko call karo", "Rahul ko phone lagao", "Call Dad", "Call Pooja" -> call callContact(contactName: ...)
- For opening a web link:
  - call openUrl(url: ...)

AFTER A TOOL CALL EXECUTES:
You will receive the tool execution response back. Always acknowledge the real outcome warmly and naturally in the user's language:
- If opened successfully: confirm warmly (e.g. in Hindi "Haanji, WhatsApp open kar rahi hoon", or in English "Opening WhatsApp for you now").
- If contact_not_found: tell the user gently that the contact was not found in their contacts list.
- If multiple_matches: ask the user which specific person they meant (e.g., "I found two contacts for Rahul: Rahul Sharma and Rahul Verma. Which one should I call?").
- If unsupported in browser: explain clearly and politely.
Never claim you made a call or opened an app if the tool reported an error or contact was missing.`;

// 1. Health check & status endpoint
app.get("/api/health", (_req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    app: "Arushi - Your Personal AI Assistant",
    version: "1.0",
    hasApiKey,
    liveSupported: true,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat endpoint with memory, tone, and tool calling
app.post("/api/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          "GEMINI_API_KEY is missing. Please configure it in AI Studio Settings > Secrets to activate live intelligence.",
      });
    }

    const {
      message,
      history = [],
      userProfile = {},
      memories = [],
      tone = "balanced",
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const memoryContext =
      memories.length > 0
        ? `User-Controlled Memories:\n${memories.map((m: any) => `- ${m.text || m}`).join("\n")}`
        : "No prior memories recorded.";

    const toneInstructions =
      {
        balanced: "Warm, concise, professional, and genuinely helpful companion.",
        concise: "Extremely direct, fast, bulleted where helpful, minimal pleasantries.",
        empathetic: "Supportive, attentive to emotional cues, validating, gentle and encouraging.",
        expert: "Analytical, highly precise, structured, detailed reasoning with clear headers.",
      }[tone as "balanced" | "concise" | "empathetic" | "expert"] || "Warm, concise, and helpful.";

    const systemInstruction = `You are Arushi, "Your Personal AI Assistant" — a premier mobile AI companion.
Personality: ${toneInstructions}
User Name: ${userProfile.name || "Friend"}
Preferred Tone: ${tone}
${memoryContext}

Language & Action Guidelines:
- You natively understand Hindi, English, Hinglish, Marathi, Bengali, Tamil, Telugu, and other languages.
- Detect the language of the user's message and respond in the same language.
- If the user asks to open an app or make a call, call the appropriate tool.
- Provide clean, beautifully formatted markdown answers.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (item.role === "user" || item.role === "assistant") {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.text || item.content || "" }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: ARUSHI_TOOL_DECLARATIONS }],
      },
    });

    // Check if tool calls were triggered
    const functionCalls = response.functionCalls;
    let actionRequested: any = null;

    if (functionCalls && functionCalls.length > 0) {
      actionRequested = functionCalls[0];
    }

    res.json({
      text: response.text || (actionRequested ? `Executing ${actionRequested.name}...` : "I am here for you."),
      actionRequested,
    });
  } catch (error: any) {
    console.error("Chat generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI response",
    });
  }
});

// 3. Vision & Document Scan endpoint
app.post("/api/vision", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is missing. Please configure it in AI Studio Settings > Secrets.",
      });
    }

    const { imageBase64, mimeType = "image/jpeg", action = "ask", prompt = "" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data (imageBase64) is required." });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    let systemInstruction = "You are Arushi's visual perception and document analysis engine.";
    let actionPrompt = "";

    switch (action) {
      case "ocr":
      case "extract_text":
        systemInstruction = "You are an expert OCR and document reader. Extract text with highest precision.";
        actionPrompt =
          "Extract all text present in this image or document with 100% fidelity. Preserve original line breaks, headings, tables, and punctuation. If handwriting is present, transcribe it carefully. If no readable text is found, clearly state that.";
        break;
      case "explain":
        systemInstruction = "You are an expert educator and visual analyst. Break down complex visual information clearly.";
        actionPrompt = prompt
          ? `Explain the contents of this image in depth, focusing on: ${prompt}`
          : "Provide a comprehensive, structured explanation of what is shown in this image or document. Break down key concepts, diagrams, objects, context, and significance in an easy-to-understand manner.";
        break;
      case "summarize":
        systemInstruction = "You are a concise executive summarizer. Synthesize core takeaways.";
        actionPrompt =
          "Analyze this image or document and provide a clear, high-impact summary. Include: 1) Executive Summary (2-3 sentences), 2) Key Takeaways / Main Points (bullet points), 3) Actionable Items or Conclusions.";
        break;
      case "ask":
      default:
        actionPrompt = prompt || "Analyze this image and describe the key elements, any readable text, and notable observations.";
        break;
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [imagePart, { text: actionPrompt }],
      },
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      result: response.text || "No analysis could be completed for this image.",
      action,
    });
  } catch (error: any) {
    console.error("Vision processing error:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze image.",
    });
  }
});

// 4. Study Mode Generator
app.post("/api/study/generate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is missing. Please configure it in AI Studio Settings > Secrets.",
      });
    }

    const { topic, notes } = req.body;
    if (!topic && !notes) {
      return res.status(400).json({ error: "Either topic or notes must be provided." });
    }

    const prompt = `Create a study bundle for: ${topic || "User Notes"}.
Context/Source Notes:
${notes || "Generate comprehensive flashcards and quiz questions for this topic."}

Return a valid JSON object ONLY, with this exact schema:
{
  "topic": "${topic || "Study Session"}",
  "summary": "Brief 2-3 sentence overview of this study subject",
  "flashcards": [
    { "front": "Concept or Question", "back": "Clear concise answer/definition" }
  ],
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ],
  "keyTakeaways": ["Key bullet 1", "Key bullet 2", "Key bullet 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Study generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate study materials",
    });
  }
});

// 5. Journal & Mood Reflection
app.post("/api/journal/reflect", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is missing. Please configure it in AI Studio Settings > Secrets.",
      });
    }

    const { entry, mood, tags = [] } = req.body;
    if (!entry) {
      return res.status(400).json({ error: "Journal entry text is required" });
    }

    const prompt = `You are Arushi, a caring, non-judgmental personal AI companion.
The user just logged a journal entry:
Mood: ${mood}
Tags: ${tags.join(", ") || "None"}
Entry:
"""
${entry}
"""

Provide a compassionate, thoughtful reflection (around 80-120 words).
Structure your response with:
1) Empathetic validation of how they feel.
2) An insightful reflection on what they wrote.
3) An uplifting or grounding question / gentle affirmation to carry forward.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({
      reflection: response.text,
    });
  } catch (error: any) {
    console.error("Journal reflection error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate journal reflection",
    });
  }
});

// 6. Memory Extraction endpoint
app.post("/api/memories/extract", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is missing.",
      });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const prompt = `Analyze the following user input and identify any enduring personal facts, preferences, goals, or relationships worth remembering in a personal memory vault.
If there are no personal facts, return an empty array.

User input:
"""
${text}
"""

Return a JSON array of objects only:
[
  {
    "category": "personal" | "preference" | "goal" | "relationship" | "work" | "health",
    "text": "User likes...",
    "importance": "high" | "medium" | "low"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const memories = JSON.parse(response.text || "[]");
    res.json({ memories });
  } catch (error: any) {
    console.error("Memory extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract memories" });
  }
});

// Create HTTP server for Express and WebSockets
const server = http.createServer(app);

// WebSocket server for Gemini Live real-time audio and function calling
const wss = new WebSocketServer({ server, path: "/api/live" });

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("[Gemini Live WS] Client connected to live audio socket");
  const ai = getGeminiClient();

  if (!ai) {
    clientWs.send(
      JSON.stringify({
        type: "error",
        message: "GEMINI_API_KEY is not configured in environment.",
      })
    );
    clientWs.close();
    return;
  }

  let session: any = null;
  let isClosed = false;

  try {
    session = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede",
            },
          },
        },
        systemInstruction: ARUSHI_LIVE_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: ARUSHI_TOOL_DECLARATIONS }],
      },
      callbacks: {
        onmessage: (message: any) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio data from Gemini Live (24kHz PCM)
          const audioChunk = message.serverContent?.modelTurn?.parts?.find(
            (p: any) => p.inlineData?.data
          )?.inlineData?.data;

          if (audioChunk) {
            clientWs.send(
              JSON.stringify({
                type: "audio",
                audio: audioChunk,
                sampleRate: 24000,
              })
            );
          }

          // 2. Interruption signal (user spoke while model was talking)
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }

          // 3. Transcription/Text from model
          const textPart = message.serverContent?.modelTurn?.parts?.find(
            (p: any) => p.text
          )?.text;

          if (textPart) {
            clientWs.send(JSON.stringify({ type: "model_text", text: textPart }));
          }

          // 4. Function Tool Calls
          if (
            message.toolCall?.functionCalls &&
            message.toolCall.functionCalls.length > 0
          ) {
            console.log(
              "[Gemini Live WS] Tool call received from model:",
              message.toolCall.functionCalls
            );
            clientWs.send(
              JSON.stringify({
                type: "tool_call",
                calls: message.toolCall.functionCalls,
              })
            );
          }
        },
        onclose: () => {
          console.log("[Gemini Live WS] Model live session closed");
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "session_closed" }));
          }
        },
        onerror: (err: any) => {
          console.error("[Gemini Live WS] Model session error:", err);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "error",
                message: err.message || "Live session error",
              })
            );
          }
        },
      },
    });

    clientWs.send(
      JSON.stringify({
        type: "session_ready",
        voice: "Aoede",
        assistant: "Arushi",
      })
    );
  } catch (err: any) {
    console.error("[Gemini Live WS] Failed to connect to Gemini Live:", err);
    clientWs.send(
      JSON.stringify({
        type: "error",
        message:
          "Could not initialize Gemini Live session: " +
          (err.message || String(err)),
      })
    );
    clientWs.close();
    return;
  }

  clientWs.on("message", (raw: any) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "audio" && msg.audio) {
        // Stream raw 16kHz audio chunk to Gemini Live
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (msg.type === "text" && msg.text) {
        // Stream text input to Gemini Live
        session.sendRealtimeInput({
          text: msg.text,
        });
      } else if (msg.type === "tool_response") {
        // Send tool execution result back to Gemini Live
        console.log(
          "[Gemini Live WS] Forwarding tool response to model:",
          msg.id,
          msg.name,
          msg.response
        );
        session.sendToolResponse({
          functionResponses: [
            {
              id: msg.id,
              name: msg.name,
              response: msg.response || { success: true },
            },
          ],
        });
      }
    } catch (e: any) {
      console.error("[Gemini Live WS] Error handling client message:", e);
    }
  });

  clientWs.on("close", () => {
    isClosed = true;
    try {
      if (session) session.close();
    } catch (e) {
      // ignore
    }
  });

  clientWs.on("error", (e: any) => {
    console.warn("[Gemini Live WS] Client socket error:", e);
  });
});

// Vite middleware for development & static serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.on("error", (err: any) => {
    console.error("[Server Error]", err);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Arushi 1.0] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
