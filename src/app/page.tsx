"use client";

import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }

const DEMO_MESSAGES: Message[] = [
  { role: "assistant", content: "Hi! I'm the AI receptionist for Brows By Mia. How can I help you today? 💕" },
  { role: "user", content: "What lash services do you offer?" },
  { role: "assistant", content: "We offer Classic sets ($120), Hybrid sets ($145), and Volume sets ($165). All sets include a free consultation! We also do fills every 2-3 weeks starting at $55. Would you like to book a session?" },
  { role: "user", content: "How long does it take?" },
  { role: "assistant", content: "A full set takes about 2 hours. Fills are usually 60-90 minutes depending on how much has grown out. We want you relaxed, not rushed! 😊" },
];

export default function LandingPage() {
  const [messages, setMessages] = useState<Message[]>([DEMO_MESSAGES[0]]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demoStep < DEMO_MESSAGES.length - 1) {
      const t = setTimeout(() => {
        setMessages(prev => [...prev, DEMO_MESSAGES[demoStep + 1]]);
        setDemoStep(d => d + 1);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [demoStep]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user" as const, content: text }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setMessages(prev => [...prev, { role: "assistant" as const, content: "This is a demo! Sign up to configure your own AI receptionist with your real services and pricing. 🚀" }]);
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fff", color: "#1a1a1a" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Nav */}
      <nav style={{ padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Apex <span style={{ background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Receptionist</span></div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#how" style={{ color: "#888", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>How it works</a>
          <a href="#pricing" style={{ color: "#888", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Pricing</a>
          <a href="/login" style={{ color: "#888", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Sign in</a>
          <a href="/signup" style={{ padding: "9px 20px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", borderRadius: 10, color: "#fff", fontSize: 14, textDecoration: "none", fontWeight: 700 }}>Start Free Trial</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div style={{ animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0f0ff", border: "1px solid #6b8cff33", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#6b8cff", fontWeight: 600, marginBottom: 24 }}>
            ⚡ AI Receptionist for Service Businesses
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Never Miss a<br />
            <span style={{ background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Client Again</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.6, marginBottom: 32 }}>
            Your AI receptionist answers questions, handles intake, and captures booking requests 24/7 — even while you're with a client.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
            <a href="/signup" style={{ padding: "14px 28px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", borderRadius: 12, color: "#fff", fontSize: 16, textDecoration: "none", fontWeight: 700 }}>Start 7-Day Free Trial →</a>
            <a href="#demo" style={{ padding: "14px 28px", background: "#f5f5f5", borderRadius: 12, color: "#333", fontSize: 16, textDecoration: "none", fontWeight: 600 }}>See Demo</a>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["✓ 7 days free", "✓ No credit card required", "✓ 10-min setup"].map(t => (
              <div key={t} style={{ color: "#888", fontSize: 13 }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Live demo chat */}
        <div id="demo" style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(107,140,255,0.15)", border: "1px solid #e8e8ff", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #6b8cff, #c084fc)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Brows By Mia — AI Receptionist</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>● Always online</div>
            </div>
          </div>
          <div style={{ height: 280, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease" }}>
                <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? "linear-gradient(135deg, #6b8cff, #c084fc)" : "#f5f5f5", color: msg.role === "user" ? "#fff" : "#1a1a1a", fontSize: 13, lineHeight: 1.5 }}>
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
          <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Try asking a question..." style={{ flex: 1, padding: "9px 14px", border: "1px solid #e5e5e5", borderRadius: 20, fontSize: 13, outline: "none" }} />
            <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", color: "#fff", cursor: "pointer", opacity: !input.trim() ? 0.5 : 1 }}>→</button>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div style={{ background: "#f8f8ff", borderTop: "1px solid #e8e8ff", borderBottom: "1px solid #e8e8ff", padding: "20px 40px", textAlign: "center" }}>
        <div style={{ color: "#888", fontSize: 13 }}>Perfect for: <strong style={{ color: "#333" }}>Lash Techs · Microblading · PMU Artists · Nail Techs · Estheticians · Hair Salons · HVAC · Dentists · Real Estate · Photographers</strong></div>
      </div>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>Up and running in <span style={{ background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>10 minutes</span></h2>
          <p style={{ color: "#888", fontSize: 16 }}>No tech skills required.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[
            { step: "01", title: "Sign up & configure", desc: "Add your services, pricing, and policies. Takes 10 minutes.", icon: "⚡" },
            { step: "02", title: "Paste one line of code", desc: "Copy your embed code and paste it into your website. Done.", icon: "💻" },
            { step: "03", title: "Never miss a client", desc: "Your AI handles questions and captures leads 24/7 automatically.", icon: "🎯" },
          ].map(s => (
            <div key={s.step} style={{ textAlign: "center", padding: 32, background: "#fafafa", borderRadius: 20, border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6b8cff", letterSpacing: 2, marginBottom: 10 }}>STEP {s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{s.title}</div>
              <div style={{ color: "#888", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 40px", background: "#f8f8ff" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>Simple Pricing</h2>
          <p style={{ color: "#888", marginBottom: 40 }}>One plan. Everything included.</p>
          <div style={{ background: "#fff", borderRadius: 24, padding: 40, boxShadow: "0 20px 60px rgba(107,140,255,0.12)", border: "2px solid #6b8cff" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6b8cff", letterSpacing: 1, marginBottom: 8 }}>APEX AI RECEPTIONIST</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              <div style={{ fontSize: 56, fontWeight: 900 }}>$79</div>
              <div style={{ color: "#888", paddingBottom: 12 }}>/month</div>
            </div>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14, marginBottom: 32 }}>First 7 days FREE</div>
            {["24/7 AI chat on your website", "Custom services & pricing", "Booking request capture", "Client intake questions", "Unlimited conversations", "Works for any service business", "Cancel anytime"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, textAlign: "left" }}>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>✓</span>
                <span style={{ color: "#555", fontSize: 14 }}>{f}</span>
              </div>
            ))}
            <a href="/signup" style={{ display: "block", marginTop: 32, padding: "16px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", borderRadius: 14, color: "#fff", fontSize: 16, textDecoration: "none", fontWeight: 700, textAlign: "center" }}>Start Free Trial — No Card Needed</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>⚡ <strong>Apex AI Receptionist</strong></div>
        <div style={{ color: "#aaa", fontSize: 13, marginBottom: 16 }}>Never miss a client again.</div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <a href="/login" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Sign In</a>
          <a href="/signup" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Sign Up</a>
          <a href="/signup" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Get Started</a>
        </div>
      </footer>
    </div>
  );
}
