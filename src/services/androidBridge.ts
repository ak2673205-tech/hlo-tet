import { Contact } from "../types";

export interface AndroidBridgeInterface {
  openApp?: (appName: string) => boolean | string;
  makeCall?: (phoneNumber: string) => boolean | string;
  callContact?: (contactName: string) => string;
  openWhatsApp?: () => boolean | string;
  openUrl?: (url: string) => boolean | string;
  getContacts?: () => string; // Returns JSON string of Contact[]
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
    Android?: AndroidBridgeInterface;
  }
}

export interface ActionResult {
  success: boolean;
  action: string;
  status: "executed" | "fallback_opened" | "contact_not_found" | "multiple_matches" | "unsupported";
  message: string;
  details?: any;
}

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "cnt-1",
    name: "Mummy (Mom)",
    aliases: ["mom", "mummy", "mother", "maa", "mum"],
    phone: "+919876543210",
    relationship: "Mother",
  },
  {
    id: "cnt-2",
    name: "Papa (Dad)",
    aliases: ["dad", "papa", "father", "pitaji", "bauji"],
    phone: "+919876543211",
    relationship: "Father",
  },
  {
    id: "cnt-3",
    name: "Rahul Sharma",
    aliases: ["rahul", "rahul sharma", "bhai"],
    phone: "+919876543212",
    relationship: "Friend",
  },
  {
    id: "cnt-4",
    name: "Pooja",
    aliases: ["pooja", "pooja didi", "sister"],
    phone: "+919876543213",
    relationship: "Sister",
  },
];

class AndroidActionBridgeService {
  private contactsKey = "anu_user_contacts_v1";

  // Check if packaged inside native Android APK wrapper
  public isNativeBridgeAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.AndroidBridge || window.Android);
  }

  private getNativeBridge(): AndroidBridgeInterface | null {
    if (typeof window === "undefined") return null;
    return window.AndroidBridge || window.Android || null;
  }

  // Retrieve saved contacts (merges native contacts if available)
  public getContacts(): Contact[] {
    if (typeof window === "undefined") return DEFAULT_CONTACTS;

    const nativeBridge = this.getNativeBridge();
    if (nativeBridge?.getContacts) {
      try {
        const raw = nativeBridge.getContacts();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("[ActionBridge] Failed to parse native contacts", e);
      }
    }

    try {
      const stored = localStorage.getItem(this.contactsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("[ActionBridge] Storage read error", e);
    }

    // Default seed
    localStorage.setItem(this.contactsKey, JSON.stringify(DEFAULT_CONTACTS));
    return DEFAULT_CONTACTS;
  }

  public saveContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem(this.contactsKey, JSON.stringify(contacts));
    } catch (e) {
      console.warn("[ActionBridge] Storage save error", e);
    }
  }

  public addContact(contact: Omit<Contact, "id">): Contact {
    const contacts = this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: "cnt-" + Date.now(),
    };
    contacts.push(newContact);
    this.saveContacts(contacts);
    return newContact;
  }

  // 1. Open WhatsApp
  public openWhatsApp(message?: string, phoneNumber?: string): ActionResult {
    const bridge = this.getNativeBridge();
    if (bridge?.openWhatsApp) {
      try {
        bridge.openWhatsApp();
        return {
          success: true,
          action: "openWhatsApp",
          status: "executed",
          message: "WhatsApp opened via Android native intent.",
          details: { method: "native_intent" },
        };
      } catch (e: any) {
        console.warn("[ActionBridge] Native openWhatsApp error", e);
      }
    }

    // Browser / WebView Deep Link fallback
    try {
      let targetUrl = "whatsapp://";
      if (phoneNumber) {
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
        targetUrl = `https://wa.me/${cleanNumber}${
          message ? `?text=${encodeURIComponent(message)}` : ""
        }`;
      } else if (message) {
        targetUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      }

      // Safe trigger
      const link = document.createElement("a");
      link.href = targetUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        action: "openWhatsApp",
        status: "fallback_opened",
        message: "Opened WhatsApp via universal app link.",
        details: { url: targetUrl, method: "deep_link" },
      };
    } catch (err: any) {
      return {
        success: false,
        action: "openWhatsApp",
        status: "unsupported",
        message: "Could not open WhatsApp on this browser: " + err.message,
      };
    }
  }

  // 2. Open App (YouTube, Instagram, Chrome, Settings, etc.)
  public openApp(appName: string): ActionResult {
    const normalized = appName.trim().toLowerCase();
    const bridge = this.getNativeBridge();

    if (bridge?.openApp) {
      try {
        const res = bridge.openApp(normalized);
        return {
          success: Boolean(res),
          action: "openApp",
          status: "executed",
          message: `Opened ${appName} via native Android intent.`,
          details: { app: appName, method: "native_intent" },
        };
      } catch (e: any) {
        console.warn("[ActionBridge] Native openApp error", e);
      }
    }

    // Web & Deep-link mappings
    const appMap: Record<string, { deepLink: string; webUrl: string }> = {
      youtube: { deepLink: "vnd.youtube://", webUrl: "https://www.youtube.com" },
      instagram: { deepLink: "instagram://app", webUrl: "https://www.instagram.com" },
      chrome: { deepLink: "googlechrome://", webUrl: "https://www.google.com" },
      browser: { deepLink: "googlechrome://", webUrl: "https://www.google.com" },
      google: { deepLink: "googlechrome://", webUrl: "https://www.google.com" },
      spotify: { deepLink: "spotify://", webUrl: "https://open.spotify.com" },
      twitter: { deepLink: "twitter://", webUrl: "https://x.com" },
      x: { deepLink: "twitter://", webUrl: "https://x.com" },
      maps: { deepLink: "geo:0,0?q=", webUrl: "https://maps.google.com" },
      gmail: { deepLink: "googlegmail://", webUrl: "mailto:" },
      camera: { deepLink: "camera://", webUrl: "#scan" },
    };

    if (normalized.includes("setting")) {
      return {
        success: false,
        action: "openApp",
        status: "unsupported",
        message:
          "Device Settings require the native Android APK wrapper. In a standard browser, please open system settings directly from your notifications drawer.",
        details: { app: "Settings", required: "Android native APK bridge" },
      };
    }

    // Look for match
    let target = Object.entries(appMap).find(([k]) => normalized.includes(k))?.[1];

    if (!target) {
      // Fallback search link
      target = {
        deepLink: `https://www.google.com/search?q=${encodeURIComponent(appName)}`,
        webUrl: `https://www.google.com/search?q=${encodeURIComponent(appName)}`,
      };
    }

    try {
      const link = document.createElement("a");
      link.href = target.webUrl || target.deepLink;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        action: "openApp",
        status: "fallback_opened",
        message: `Opened ${appName}.`,
        details: { app: appName, url: target.webUrl },
      };
    } catch (e: any) {
      return {
        success: false,
        action: "openApp",
        status: "unsupported",
        message: `Unable to launch ${appName} in browser: ` + e.message,
      };
    }
  }

  // 3. Open URL
  public openUrl(url: string): ActionResult {
    const bridge = this.getNativeBridge();
    if (bridge?.openUrl) {
      try {
        bridge.openUrl(url);
        return {
          success: true,
          action: "openUrl",
          status: "executed",
          message: `Opened link: ${url}`,
        };
      } catch (e) {
        // fallback
      }
    }

    try {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://" + finalUrl;
      }
      window.open(finalUrl, "_blank", "noopener,noreferrer");
      return {
        success: true,
        action: "openUrl",
        status: "fallback_opened",
        message: `Opened URL: ${finalUrl}`,
        details: { url: finalUrl },
      };
    } catch (err: any) {
      return {
        success: false,
        action: "openUrl",
        status: "unsupported",
        message: "Failed to open URL: " + err.message,
      };
    }
  }

  // 4. Make Phone Call by Number
  public makeCall(phoneNumber: string): ActionResult {
    const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, "");
    if (!cleanNumber) {
      return {
        success: false,
        action: "makeCall",
        status: "unsupported",
        message: "Invalid phone number provided.",
      };
    }

    const bridge = this.getNativeBridge();
    if (bridge?.makeCall) {
      try {
        bridge.makeCall(cleanNumber);
        return {
          success: true,
          action: "makeCall",
          status: "executed",
          message: `Calling ${cleanNumber} via Android phone service.`,
          details: { phoneNumber: cleanNumber, method: "native_call" },
        };
      } catch (e: any) {
        console.warn("[ActionBridge] Native makeCall error", e);
      }
    }

    // Web fallback: tel: link opens system phone dialer safely
    try {
      const telUrl = `tel:${cleanNumber}`;
      const link = document.createElement("a");
      link.href = telUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        action: "makeCall",
        status: "fallback_opened",
        message: `Opening phone dialer for ${cleanNumber}.`,
        details: { phoneNumber: cleanNumber, method: "tel_dialer" },
      };
    } catch (err: any) {
      return {
        success: false,
        action: "makeCall",
        status: "unsupported",
        message: "Could not open dialer: " + err.message,
      };
    }
  }

  // 5. Call Contact by Name (with fuzzy matching and safety checks)
  public callContact(contactName: string): ActionResult {
    const rawQuery = contactName.trim().toLowerCase();
    const query = rawQuery
      .replace(/^(call|phone|lagao|karo|ko|please|can you)\s+/g, "")
      .replace(/\s+(ko|call|phone|lagao|karo)$/g, "")
      .trim();

    const contacts = this.getContacts();

    // Exact or alias match
    const exactMatches = contacts.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(query) || query.includes(c.name.toLowerCase());
      const aliasMatch = c.aliases.some(
        (a) => a.toLowerCase() === query || query.includes(a.toLowerCase()) || a.toLowerCase().includes(query)
      );
      return nameMatch || aliasMatch;
    });

    if (exactMatches.length === 0) {
      return {
        success: false,
        action: "callContact",
        status: "contact_not_found",
        message: `I couldn't find "${contactName}" in your contacts.`,
        details: { query: contactName, availableContacts: contacts.map((c) => c.name) },
      };
    }

    if (exactMatches.length > 1) {
      return {
        success: false,
        action: "callContact",
        status: "multiple_matches",
        message: `Found ${exactMatches.length} contacts matching "${contactName}": ${exactMatches
          .map((m) => m.name)
          .join(", ")}. Which one would you like to call?`,
        details: {
          query: contactName,
          matches: exactMatches.map((m) => ({ name: m.name, phone: m.phone })),
        },
      };
    }

    // Exactly one match
    const target = exactMatches[0];
    const callRes = this.makeCall(target.phone);

    return {
      success: callRes.success,
      action: "callContact",
      status: callRes.status,
      message: `Calling ${target.name} (${target.phone}).`,
      details: {
        contact: target,
        phoneNumber: target.phone,
        method: callRes.details?.method,
      },
    };
  }
}

export const androidBridge = new AndroidActionBridgeService();
