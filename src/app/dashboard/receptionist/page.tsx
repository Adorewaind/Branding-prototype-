"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Service { name: string; price: string; description: string; }
interface FAQ { question: string; answer: string; }
interface Settings {
  ai_name: string;
  greeting: string;
  deposit_policy: string;
  cancellation_policy: string;
  booking_link: string;
  accent_color: string;
  services: Service[];
  faqs: FAQ[];
}

const DEFAULTS: Settings = {
  ai_name: "Your AI Receptionist",
  greeting: "Hi! Welcome. How can I help you today? 💕",
  deposit_policy: "A 25% non-refundable deposit is required to secure all appointments.",
  cancellation_policy: "Cancellations with less than 24 hours notice forfeit the deposit.",
  booking_link: "",
  accent_color: "#6b8cff",
  services: [],
  faqs: [],
};

const inp = { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" } as const;
const lbl = { color: "#555", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 };

export default function ReceptionistConfigPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [profileId, setProfileId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"general" | "services" | "faqs">("general");
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setProfileId(user.id);
      const { data } = await supabase.from("business_settings").select("*").eq("profile_id", user.id).single();
      if (data) {
        setSettings({
          ai_name: data.ai_name || DEFAULTS.ai_name,
          greeting: data.greeting || DEFAULTS.greeting,
          deposit_policy: data.deposit_policy || DEFAULTS.deposit_policy,
          cancellation_policy: data.cancellation_policy || DEFAULTS.cancellation_policy,
          booking_link: data.booking_link || "",
          accent_color: data.accent_color || "#6b8cff",
          services: data.services || [],
          faqs: data.faqs || [],
        });
      }
    }
    load();
  }, [router]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("business_settings").upsert({ ...settings, profile_id: profileId });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap')`}</style>

      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/dashboard" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>← Dashboard</a>
          <div style={{ color: "#2a2a2a" }}>|</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Configure AI Receptionist</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "9px 20px", background: saved ? "#1a2e1a" : "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 10, color: saved ? "#4ade80" : "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(["general", "services", "faqs"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid", borderColor: tab === t ? "#6b8cff" : "#222", background: tab === t ? "#6b8cff1a" : "#111", color: tab === t ? "#6b8cff" : "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "general" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20 }}>AI Persona</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={lbl}>AI Name (what clients see)</label>
                  <input value={settings.ai_name} onChange={e => set("ai_name", e.target.value)} style={inp} placeholder="e.g. Kiera's Assistant" />
                </div>
                <div>
                  <label style={lbl}>Opening Greeting</label>
                  <textarea value={settings.greeting} onChange={e => set("greeting", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Accent Color</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="color" value={settings.accent_color} onChange={e => set("accent_color", e.target.value)} style={{ width: 40, height: 36, padding: 2, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, cursor: "pointer" }} />
                    <input value={settings.accent_color} onChange={e => set("accent_color", e.target.value)} style={{ ...inp, width: 120 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20 }}>Policies & Booking</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={lbl}>Deposit Policy</label>
                  <textarea value={settings.deposit_policy} onChange={e => set("deposit_policy", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Cancellation Policy</label>
                  <textarea value={settings.cancellation_policy} onChange={e => set("cancellation_policy", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Booking Link (optional)</label>
                  <input value={settings.booking_link} onChange={e => set("booking_link", e.target.value)} style={inp} placeholder="https://your-booking-link.com" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700 }}>Your Services</div>
              <button
                onClick={() => set("services", [...settings.services, { name: "", price: "", description: "" }])}
                style={{ padding: "7px 14px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >+ Add Service</button>
            </div>
            {settings.services.length === 0 && (
              <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No services yet. Add your first service so clients know what you offer.</div>
            )}
            {settings.services.map((sv, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr auto", gap: 10, marginBottom: 12, alignItems: "start" }}>
                <input value={sv.name} onChange={e => set("services", settings.services.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))} placeholder="Service name" style={inp} />
                <input value={sv.price} onChange={e => set("services", settings.services.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s))} placeholder="$0" style={inp} />
                <input value={sv.description} onChange={e => set("services", settings.services.map((s, idx) => idx === i ? { ...s, description: e.target.value } : s))} placeholder="Short description" style={inp} />
                <button onClick={() => set("services", settings.services.filter((_, idx) => idx !== i))} style={{ padding: "10px 12px", background: "#2e1a1a", border: "1px solid #3a2020", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {tab === "faqs" && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700 }}>Custom FAQs</div>
              <button
                onClick={() => set("faqs", [...settings.faqs, { question: "", answer: "" }])}
                style={{ padding: "7px 14px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >+ Add FAQ</button>
            </div>
            {settings.faqs.length === 0 && (
              <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Add your most common questions so the AI answers them perfectly.</div>
            )}
            {settings.faqs.map((faq, i) => (
              <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>FAQ {i + 1}</div>
                  <button onClick={() => set("faqs", settings.faqs.filter((_, idx) => idx !== i))} style={{ padding: "4px 10px", background: "#2e1a1a", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>Remove</button>
                </div>
                <input value={faq.question} onChange={e => set("faqs", settings.faqs.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f))} placeholder="Question clients ask..." style={{ ...inp, marginBottom: 8 }} />
                <textarea value={faq.answer} onChange={e => set("faqs", settings.faqs.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))} placeholder="How the AI should answer..." rows={2} style={{ ...inp, resize: "vertical" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
