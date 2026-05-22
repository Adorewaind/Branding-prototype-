"use client";

import { useState, useRef, useEffect } from "react";
import { use } from "react";

interface Message { role: "user" | "assistant"; content: string; }

const QUICK_REPLIES = ["What services do you offer?", "How much does it cost?", "What's your deposit policy?", "How do I book?"];

export default function WidgetPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! How can I help you today? 😊" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [color] = useState("#6b8cff");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const updated = [...messages, { role: "user" as const, content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, businessId }),
      });
      const data = await res.json();
      if (data.reply) setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>

      {/* Chat window */}
      {open && (
        <div style={{ position: "absolute", bottom: 70, right: 0, width: 340, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden", animation: "slideUp 0.2s ease" }}>
          {/* Header */}
          <div style={{ background: color, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>AI Receptionist</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>● Online now</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ height: 300, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? color : "#f5f5f5", color: msg.role === "user" ? "#fff" : "#1a1a1a", fontSize: 13, lineHeight: 1.5 }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#f5f5f5", borderRadius: "4px 16px 16px 16px", width: "fit-content" }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#bbb", display: "inline-block", animation: `bounce 1s ${i*0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_REPLIES.map(q => (
              <button key={q} onClick={() => send(q)} disabled={loading} style={{ padding: "5px 10px", background: "#fff", border: `1px solid ${color}44`, borderRadius: 14, color, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Type a message..." style={{ flex: 1, padding: "9px 12px", border: "1px solid #e5e5e5", borderRadius: 20, fontSize: 13, outline: "none", background: "#fafafa" }} />
            <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{ width: 36, height: 36, borderRadius: "50%", background: color, border: "none", color: "#fff", cursor: "pointer", fontSize: 16, opacity: loading || !input.trim() ? 0.5 : 1 }}>→</button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button onClick={() => setOpen(!open)} style={{ width: 56, height: 56, borderRadius: "50%", background: color, border: "none", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {open ? "×" : "⚡"}
      </button>
    </div>
  );
}
