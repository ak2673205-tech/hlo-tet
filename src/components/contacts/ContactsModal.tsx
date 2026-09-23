import React, { useState } from "react";
import {
  X,
  Phone,
  UserPlus,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
} from "lucide-react";
import { Contact } from "../../types";
import { androidBridge } from "../../services/androidBridge";

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  onTriggerCall: (contact: Contact) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onUpdateContacts,
  onTriggerCall,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [aliasesStr, setAliasesStr] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isNative = androidBridge.isNativeBridgeAvailable();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const aliases = aliasesStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Always include the contact's name as an alias
    if (!aliases.includes(name.trim().toLowerCase())) {
      aliases.push(name.trim().toLowerCase());
    }

    const created = androidBridge.addContact({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || undefined,
      aliases,
    });

    onUpdateContacts(androidBridge.getContacts());
    setName("");
    setPhone("");
    setRelationship("");
    setAliasesStr("");
    setIsAdding(false);
    setFeedback(`Added ${created.name} to phonebook`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    androidBridge.saveContacts(updated);
    onUpdateContacts(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Contacts & Call Safety</h3>
              <p className="text-xs text-slate-400">Used for "Call Mom", "Rahul ko phone lagao"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bridge Status Indicator */}
        <div className="my-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="font-semibold text-slate-200">
                {isNative ? "Android Native APK Bridge" : "Browser Web Fallback Bridge"}
              </span>
              <p className="text-[11px] text-slate-400">
                {isNative
                  ? "Direct Android Intent calling & contacts search active"
                  : "Uses system tel: protocol with pre-filled dialer & safety confirmation"}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isNative
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
            }`}
          >
            {isNative ? "Native" : "Web Safe"}
          </span>
        </div>

        {feedback && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center font-bold text-indigo-300 text-xs">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{contact.name}</span>
                    {contact.relationship && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        {contact.relationship}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-cyan-400">{contact.phone}</span>
                  <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                    Voice triggers: {contact.aliases.join(", ")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onTriggerCall(contact)}
                  title="Call contact"
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Contact Form Toggle */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-3 w-full py-2.5 px-4 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Custom Contact</span>
          </button>
        ) : (
          <form onSubmit={handleAdd} className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-200">New Contact</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Rahul)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="tel"
                placeholder="Phone (+919876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Relation (e.g. Brother)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Voice Aliases (comma separated)"
                value={aliasesStr}
                onChange={(e) => setAliasesStr(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
