"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "What lash services do you offer?",
  "How much is a full set?",
  "What's your deposit policy?",
  "How do I care for my lashes?",
  "Tell me about microblading",
  "I want to book an appointment",
];

export default function ReceptionistPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi gorgeous! 💕 Welcome to the studio. I'm your AI receptionist — I can answer questions about our lash, microblading, and PMU services, walk you through aftercare, or help you book an appointment. What can I help you with today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "embed">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.reply) setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      else setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble with that. Please try again! 💕" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6f9", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0e6ef", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ color: "#c084a0", fontSize: 12, textDecoration: "none" }}>← All Apps</a>
          <div style={{ width: 1, height: 16, background: "#e8d5e3" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💅</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>Beauty Studio AI</div>
              <div style={{ fontSize: 11, color: "#c084a0" }}>● Online — always here for you</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["chat", "embed"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #f0e6ef", background: mode === m ? "linear-gradient(135deg, #f9a8d4, #c084fc)" : "#fff", color: mode === m ? "#fff" : "#888", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {m === "chat" ? "Chat View" : "Embed Preview"}
            </button>
          ))}
        </div>
      </div>

      {mode === "embed" ? (
        /* Embed preview — shows widget on a fake salon site */
        <div style={{ display: "flex", height: "calc(100vh - 69px)" }}>
          <div style={{ flex: 1, background: "#f8f0f5", padding: 40, overflowY: "auto" }}>
            {/* Fake salon website */}
            <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
              <div style={{ background: "linear-gradient(135deg, #2d1a2e 0%, #4a1a3a 100%)", padding: "60px 48px", textAlign: "center" }}>
                <div style={{ fontSize: 12, letterSpacing: 4, color: "#f9a8d4", marginBottom: 16, textTransform: "uppercase" }}>Luxury Beauty Studio</div>
                <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Your Brows. Your Lashes.<br />Your Confidence.</h1>
                <p style={{ color: "#e8b4cc", fontSize: 16, maxWidth: 500, margin: "0 auto 32px" }}>Expert lash extensions, microblading, and permanent makeup in a relaxing, luxury environment.</p>
                <button style={{ padding: "14px 32px", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", border: "none", borderRadius: 30, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Book Your Appointment</button>
              </div>
              <div style={{ padding: "60px 48px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
                  {[{ icon: "✨", title: "Lash Extensions", desc: "Classic, Hybrid & Volume sets from $120" }, { icon: "🎨", title: "Microblading", desc: "Natural brow enhancement from $450" }, { icon: "💄", title: "Permanent Makeup", desc: "Lip blush, eyeliner PMU from $350" }].map(s => (
                    <div key={s.title} style={{ textAlign: "center", padding: 24, background: "#fdf6f9", borderRadius: 16 }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#1a1a1a" }}>{s.title}</div>
                      <div style={{ color: "#888", fontSize: 13 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating chat widget */}
          <div style={{ width: 380, background: "#fff", borderLeft: "1px solid #f0e6ef", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #2d1a2e, #4a1a3a)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💅</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Studio Assistant</div>
                <div style={{ color: "#f9a8d480", fontSize: 11 }}>● Online now</div>
              </div>
            </div>
            <ChatArea messages={messages} loading={loading} bottomRef={bottomRef} dark />
            <ChatInput input={input} setInput={setInput} onSend={send} loading={loading} quickReplies={QUICK_REPLIES} dark />
          </div>
        </div>
      ) : (
        /* Full chat view */
        <div style={{ maxWidth: 680, margin: "0 auto", height: "calc(100vh - 69px)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff0f8", border: "1px solid #f9a8d4", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#c084a0", fontWeight: 600, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              AI Receptionist Active
            </div>
            <p style={{ color: "#999", fontSize: 13 }}>Try asking about services, pricing, aftercare, or booking an appointment.</p>
          </div>

          <ChatArea messages={messages} loading={loading} bottomRef={bottomRef} />
          <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_REPLIES.map(q => (
              <button key={q} onClick={() => send(q)} disabled={loading} style={{ padding: "6px 14px", background: "#fff", border: "1px solid #f0e6ef", borderRadius: 20, color: "#c084a0", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{q}</button>
            ))}
          </div>
          <ChatInput input={input} setInput={setInput} onSend={send} loading={loading} />
        </div>
      )}
    </div>
  );
}

function ChatArea({ messages, loading, bottomRef, dark }: { messages: Message[]; loading: boolean; bottomRef: React.RefObject<HTMLDivElement | null>; dark?: boolean }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
          {msg.role === "assistant" && (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>💅</div>
          )}
          <div style={{
            maxWidth: "78%",
            padding: "10px 14px",
            borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
            background: msg.role === "user" ? "linear-gradient(135deg, #f9a8d4, #c084fc)" : dark ? "#1e1e1e" : "#fff",
            color: msg.role === "user" ? "#fff" : dark ? "#ddd" : "#1a1a1a",
            fontSize: 13,
            lineHeight: 1.6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            border: msg.role === "assistant" && !dark ? "1px solid #f0e6ef" : "none",
          }}>
            {msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💅</div>
          <div style={{ background: dark ? "#1e1e1e" : "#fff", border: dark ? "none" : "1px solid #f0e6ef", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: 4 }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#f9a8d4", display: "inline-block", animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

function ChatInput({ input, setInput, onSend, loading, quickReplies, dark }: { input: string; setInput: (v: string) => void; onSend: (v: string) => void; loading: boolean; quickReplies?: string[]; dark?: boolean }) {
  return (
    <div style={{ padding: "12px 16px", borderTop: `1px solid ${dark ? "#2a2a2a" : "#f0e6ef"}`, background: dark ? "#111" : "#fff" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend(input)}
          placeholder="Ask about services, pricing, aftercare..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: `1px solid ${dark ? "#2a2a2a" : "#f0e6ef"}`, background: dark ? "#1a1a1a" : "#fdf6f9", color: dark ? "#fff" : "#1a1a1a", fontSize: 13, outline: "none" }}
        />
        <button onClick={() => onSend(input)} disabled={loading || !input.trim()} style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #f9a8d4, #c084fc)", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || !input.trim() ? 0.5 : 1 }}>→</button>
      </div>
    </div>
  );
}
