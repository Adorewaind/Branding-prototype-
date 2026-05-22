"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Profile { business_name: string; business_type: string; owner_name: string; id: string; email: string; }
interface Subscription { status: string; current_period_end: string | null; }

function DashboardContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("setup") === "1";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("subscriptions").select("*").eq("profile_id", user.id).single(),
      ]);
      setProfile(p);
      setSubscription(s);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
    </div>
  );

  const statusColor = subscription?.status === "active" || subscription?.status === "trialing" ? "#4ade80" : "#f87171";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const widgetUrl = `${appUrl}/widget/${profile?.id}`;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Apex AI Receptionist</div>
            <div style={{ color: "#444", fontSize: 11 }}>{profile?.business_name || "Your Business"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/dashboard/receptionist" style={{ padding: "8px 16px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, textDecoration: "none" }}>⚙️ Configure AI</a>
          <a href="/tracker" style={{ padding: "8px 16px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, textDecoration: "none" }}>📋 Outreach Tracker</a>
          <button onClick={handleLogout} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", fontSize: 13, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {/* Welcome banner for new users */}
        {isNewUser && (
          <div style={{ background: "linear-gradient(135deg, #6b8cff22, #c084fc22)", border: "1px solid #6b8cff44", borderRadius: 16, padding: 24, marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Welcome to Apex AI Receptionist!</div>
            <div style={{ color: "#888", fontSize: 14 }}>Your 30-day free trial has started. Set up your AI receptionist below to get your embed code.</div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24, borderTop: `2px solid ${statusColor}` }}>
            <div style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Subscription</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>{subscription?.status || "No Plan"}</div>
            {subscription?.current_period_end && <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</div>}
            {!subscription && <a href="/signup" style={{ color: "#6b8cff", fontSize: 12, textDecoration: "none" }}>Activate →</a>}
          </div>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24, borderTop: "2px solid #6b8cff" }}>
            <div style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Business Type</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#6b8cff" }}>{profile?.business_type || "Not set"}</div>
          </div>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24, borderTop: "2px solid #c084fc" }}>
            <div style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AI Status</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#c084fc" }}>● Active</div>
          </div>
        </div>

        {/* Embed Code */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Your Embed Code</div>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>Paste this one line into your website HTML, right before the <code style={{ color: "#c084fc" }}>&lt;/body&gt;</code> tag.</div>
          <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#4ade80", overflowX: "auto", whiteSpace: "nowrap" }}>
            {`<script src="${appUrl}/widget.js" data-business="${profile?.id}"></script>`}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={() => navigator.clipboard.writeText(`<script src="${appUrl}/widget.js" data-business="${profile?.id}"></script>`)} style={{ padding: "9px 18px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer" }}>Copy Code</button>
            <a href={widgetUrl} target="_blank" rel="noreferrer" style={{ padding: "9px 18px", background: "linear-gradient(135deg, #6b8cff22, #c084fc22)", border: "1px solid #6b8cff44", borderRadius: 8, color: "#6b8cff", fontSize: 13, textDecoration: "none" }}>Preview Widget →</a>
          </div>
        </div>

        {/* Setup steps */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Setup Checklist</div>
          {[
            { done: true, label: "Account created", desc: "You're in!" },
            { done: !!profile?.business_name, label: "Business info added", desc: "Your name and type", link: "/dashboard/receptionist" },
            { done: false, label: "Configure your AI", desc: "Add services, pricing, and FAQs", link: "/dashboard/receptionist" },
            { done: false, label: "Add embed code to website", desc: "Paste one line of code", link: "#embed" },
            { done: subscription?.status === "active" || subscription?.status === "trialing", label: "Subscription active", desc: "30-day free trial", link: "/signup" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 4 ? "1px solid #111" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: item.done ? "#1a2e1a" : "#1e1e1e", border: `2px solid ${item.done ? "#4ade80" : "#2a2a2a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                {item.done ? "✓" : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: item.done ? "#888" : "#ddd", fontWeight: 600, fontSize: 14, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
                <div style={{ color: "#555", fontSize: 12 }}>{item.desc}</div>
              </div>
              {!item.done && item.link && <a href={item.link} style={{ color: "#6b8cff", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>Set up →</a>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
