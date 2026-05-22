"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Message { role: "user" | "assistant"; content: string; }
interface BizSettings { ai_name: string; greeting: string; accent_color: string; }

export default function WidgetPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BizSettings>({ ai_name: "AI Receptionist", greeting: "Hi! How can I help you today? 💕", accent_color: "#6b8cff" });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/widget-settings?id=${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setMessages([{ role: "assistant", content: data.greeting }]);
        } else {
          setMessages([{ role: "assistant", content: settings.greeting }]);
        }
      } catch {
        setMessages([{ role: "assistant", content: settings.greeting }]);
      }
    }
    if (businessId) loadSettings();
  }, [businessId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const updated: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, messages: updated }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I had trouble with that. Please try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const accent = settings.accent_color || "#6b8cff";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{settings.ai_name}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>● Always available</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}>
            <div style={{
              maxWidth: "82%",
              padding: "9px 13px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              background: msg.role === "user" ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : "#f3f4f6",
              color: msg.role === "user" ? "#fff" : "#1a1a1a",
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#f3f4f6", borderRadius: "4px 16px 16px 16px", width: "fit-content" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af", display: "inline-block", animation: `bounce 1s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px 14px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 20, fontSize: 13, outline: "none", color: "#1a1a1a" }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: "none", color: "#fff", cursor: "pointer", fontSize: 16, opacity: !input.trim() ? 0.5 : 1, flexShrink: 0 }}
        >→</button>
      </div>
    </div>
  );
}
