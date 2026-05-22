"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a14 0%, #1a0f2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Apex AI Receptionist</h1>
          <p style={{ color: "#888", fontSize: 14 }}>Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleLogin} style={{ background: "#111", border: "1px solid #222", borderRadius: 20, padding: 32 }}>
          {error && <div style={{ background: "#2e1a1a", border: "1px solid #f8717144", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 20 }}>{error}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p style={{ textAlign: "center", marginTop: 20, color: "#555", fontSize: 13 }}>
            Don&apos;t have an account?{" "}
            <a href="/signup" style={{ color: "#6b8cff", textDecoration: "none", fontWeight: 600 }}>Start free trial</a>
          </p>
        </form>
      </div>
    </div>
  );
}
