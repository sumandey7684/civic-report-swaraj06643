
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Simple local knowledge base for "Civic" assistant
const FAQs: Array<{ q: RegExp; a: string }> = [
  { q: /hello|hi|hey/i, a: "Hi! I'm Civic. I can help you report issues, find the map, and answer questions about this app." },
  { q: /report|issue|complaint/i, a: "To report an issue, go to Report Issue, fill details, attach a photo, and submit. You'll get updates in your dashboard." },
  { q: /map|explore/i, a: "Open Map Explorer to view reported issues on the map and filter by category or status." },
  { q: /login|sign ?in/i, a: "Use Login to access your account. New users can sign up from the Signup page." },
  { q: /privacy|data/i, a: "We respect your privacy. Read our Privacy Policy page for details on data usage and storage." },
  { q: /contact|support|help/i, a: "You can reach the team via the Contact page. Provide a brief description and your email." },
  { q: /categories|types|what can i report/i, a: "You can report roads, streetlights, garbage, drainage, buildings, and other civic infrastructure issues." },
  { q: /photo|image|picture|upload/i, a: "Please upload clear images (JPEG/PNG/WebP). Avoid photos with faces for privacy. Max size is shown on the form." },
  { q: /admin|dashboard/i, a: "Admins can track and manage all incoming reports in the Admin Dashboard." },
];

function answerFromKnowledgeBase(message: string): string {
  for (const item of FAQs) {
    if (item.q.test(message)) return item.a;
  }
  return "I'm Civic. Tell me what you need help with: reporting an issue, using the map, logging in, or privacy/contact info.";
}

type NavigationCommand = { path: string; reply: string };

function navigationCommand(message: string): NavigationCommand | null {
  const normalized = message.toLowerCase().replace(/[?!.,]/g, "").trim();
  const asksToOpen = /\b(open|show|take me|go to|navigate to|visit|bring me|load)\b/.test(normalized);

  if (!asksToOpen) return null;
  if (/\b(map|map explorer|explore map)\b/.test(normalized)) {
    return { path: "/map", reply: "Opening Map Explorer for you." };
  }
  if (/\b(report|report issue|new complaint|complaint)\b/.test(normalized)) {
    return { path: "/report", reply: "Opening the issue reporting page for you." };
  }
  if (/\b(login|log in|sign in)\b/.test(normalized)) {
    return { path: "/login", reply: "Opening the sign-in page for you." };
  }
  if (/\b(sign up|signup|register|registration)\b/.test(normalized)) {
    return { path: "/signup", reply: "Opening the registration page for you." };
  }
  if (/\b(account|profile)\b/.test(normalized)) {
    return { path: "/account", reply: "Opening your account for you." };
  }
  if (/\b(settings|preferences)\b/.test(normalized)) {
    return { path: "/settings", reply: "Opening settings for you." };
  }
  if (/\b(contact|support)\b/.test(normalized)) {
    return { path: "/contact", reply: "Opening the contact page for you." };
  }
  if (/\bprivacy\b/.test(normalized)) {
    return { path: "/privacy-policy", reply: "Opening the privacy policy for you." };
  }
  if (/\babout\b/.test(normalized)) {
    return { path: "/about", reply: "Opening the about page for you." };
  }
  return null;
}

type ChatMessage = { sender: "user" | "bot"; text: string; time?: string };

const Chatbot = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "bot", text: "Hello! I'm Civic. How can I help you today?", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const respondLocally = async (userMessage: string) => {
    setLoading(true);
    setTyping(true);
    const command = navigationCommand(userMessage);
    if (command) navigate(command.path);
    // Simulate thinking delay
    await new Promise((r) => setTimeout(r, 450));
    const reply = command?.reply || answerFromKnowledgeBase(userMessage);
    setMessages((msgs) => [...msgs, { sender: "bot", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setTyping(false);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const message = input.trim();
    setMessages((msgs) => [...msgs, { sender: "user", text: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    await respondLocally(message);
  };

  const quickPrompts = [
    "How do I report an issue?",
    "Show me the map",
    "What images are allowed?",
    "Privacy policy",
  ];

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-6 right-6 rounded-2xl shadow-xl w-16 h-16 flex items-center justify-center z-50 transition-transform duration-300 hover:scale-110"
          onClick={() => setOpen(true)}
          aria-label="Open Civic chat"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 10px 30px rgba(31,38,135,0.25)",
          }}
        >
          <MessageSquare className="text-indigo-600" size={28} />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 w-80 flex flex-col z-50 transition-all duration-300 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(244,244,255,0.35))",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 12px 40px rgba(31,38,135,0.28)",
          }}
        >
          <div className="px-4 py-3 border-b-0 font-bold flex justify-between items-center rounded-t-3xl bg-white/30 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/60 border border-white/70 shadow-sm">
                <MessageSquare className="text-indigo-600" size={18} />
              </span>
              <span className="tracking-wide">Civic</span>
              <Sparkles className="text-indigo-500" size={16} />
            </div>
            <button
              className="text-lg px-2 py-0 text-gray-600 hover:text-red-400"
              onClick={() => setOpen(false)}
              aria-label="Close Civic chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300" style={{ maxHeight: 360 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm ${
                    msg.sender === "user"
                      ? "bg-white/70 text-gray-900"
                      : "bg-white/45 text-gray-800"
                  }`}
                  style={{
                    border: msg.sender === "user" ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(229,231,235,0.6)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="leading-relaxed">{msg.text}</div>
                  {msg.time && (
                    <div className="mt-1 text-[10px] text-gray-500 text-right">{msg.time}</div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="mb-2 flex justify-start">
                <div className="px-3 py-2 rounded-2xl text-sm max-w-[60%] bg-white/55 text-gray-700 shadow-sm" style={{ backdropFilter: "blur(10px)", border: "1px solid rgba(229,231,235,0.6)" }}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="text-indigo-600" size={14} />
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  className="text-xs px-2 py-1 rounded-full bg-white/60 hover:bg-white/80 border border-white/70 text-gray-700"
                  onClick={() => {
                    setMessages((m) => [...m, { sender: "user", text: p, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
                    respondLocally(p);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t-0 bg-white/30 backdrop-blur-md rounded-b-3xl shadow-sm px-2 py-2">
            <input
              className="flex-1 px-3 py-2 outline-none bg-white/60 rounded-xl text-black placeholder:text-gray-500 border border-white/70"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Civic is thinking..." : "Ask Civic anything..."}
              disabled={loading}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 text-white font-semibold shadow-md hover:scale-105 transition-transform flex items-center gap-1"
              disabled={loading}
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
