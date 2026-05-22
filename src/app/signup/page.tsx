"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPES = ["Lash Tech", "Microblading", "PMU Artist", "Nail Tech", "Esthetician", "Hair Salon", "Massage", "HVAC / Plumber", "Dentist / Medical", "Real Estate", "Photographer", "Other"];
const inp = { width: "100%", padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" } as const;
const lbl = { color: "#555", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 };

export default function SignupPage() {
  const [step, setStep] = useState<"info" | "account">("info");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Lash Tech");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) { setError(signupError.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("profiles").update({
        business_name: businessName,
        business_type: businessType,
        owner_name: ownerName,
      }).eq("id", data.user.id);
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else { setDone(true); setLoading(false); }
  }

  if (done) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a14, #1a0f2e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Check your email!</h2>
        <p style={{ color: "#666" }}>We sent a confirmation to <strong>{email}</strong>.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a14 0%, #1a0f2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap')`}</style>
      <div style={{ width: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Start Your Free Trial</h1>
          <p style={{ color: "#666", fontSize: 14 }}>7 days free · $79/month after · Cancel anytime</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["Your Business", "Create Account"].map((s, i) => {
            const active = step === "info" ? i === 0 : i === 1;
            return (
              <div key={s} style={{ flex: 1, padding: 10, borderRadius: 10, background: active ? "#6b8cff1a" : "#111", border: `1px solid ${active ? "#6b8cff" : "#222"}`, textAlign: "center", fontSize: 12, fontWeight: 700, color: active ? "#6b8cff" : "#444" }}>
                {i + 1}. {s}
              </div>
            );
          })}
        </div>

        <form onSubmit={step === "info" ? (e) => { e.preventDefault(); setStep("account"); } : handleSignup} style={{ background: "#111", border: "1px solid #222", borderRadius: 20, padding: 32 }}>
          {error && (
            <div style={{ background: "#2e1a1a", border: "1px solid #f8717144", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {step === "info" ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Business Name *</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="e.g. Lashes By Kiera" style={inp} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Your Name *</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="First and last name" style={inp} />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={lbl}>Business Type</label>
                <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="submit" style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Next →</button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Password *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 8 characters" minLength={8} style={inp} />
              </div>
              <div style={{ background: "#0d2210", border: "1px solid #4ade8033", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#4ade80", lineHeight: 1.6 }}>
                ✓ 7-day free trial — no charge today<br />
                ✓ $79/month after trial — cancel anytime
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Setting up..." : "Start Free Trial →"}
              </button>
              <button type="button" onClick={() => setStep("info")} style={{ width: "100%", padding: 10, background: "transparent", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginTop: 10 }}>← Back</button>
            </>
          )}
        </form>
        <p style={{ textAlign: "center", marginTop: 16, color: "#555", fontSize: 13 }}>
          Already have an account? <a href="/login" style={{ color: "#6b8cff", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
