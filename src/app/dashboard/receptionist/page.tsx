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

const DEFAULT_SETTINGS: Settings = {
  ai_name: "Your AI Receptionist",
  greeting: "Hi! Welcome to our studio. How can I help you today? 💕",
  deposit_policy: "A 25% non-refundable deposit is required to secure all appointments.",
  cancellation_policy: "Cancellations with less than 24 hours notice forfeit the deposit.",
  booking_link: "",
  accent_color: "#6b8cff",
  services: [],
  faqs: [],
};

export default function ReceptionistConfigPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profileId, setProfileId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"general" | "services" | "faqs">("general");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setProfileId(user.id);
      const { data } = await supabase.from("business_settings").select("*").eq("profile_id", user.id).single();
      if (data) {
        setSettings({
          ai_name: data.ai_name || DEFAULT_SETTINGS.ai_name,
          greeting: data.greeting || DEFAULT_SETTINGS.greeting,
          deposit_policy: data.deposit_policy || DEFAULT_SETTINGS.deposit_policy,
          cancellation_policy: data.cancellation_policy || DEFAULT_SETTINGS.cancellation_policy,
          booking_link: data.booking_link || "",
          accent_color: data.accent_color || "#6b8cff",
          services: data.services || [],
          faqs: data.faqs || [],
        });
      }
    }
    load();
  }, [supabase, router]);

  async function save() {
    setSaving(true);
    await supabase.from("business_settings").update(settings).eq("profile_id", profileId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addService() {
    setSettings(s => ({ ...s, services: [...s.services, { name: "", price: "", description: "" }] }));
  }

  function updateService(i: number, field: keyof Service, value: string) {
    setSettings(s => ({ ...s, services: s.services.map((sv, idx) => idx === i ? { ...sv, [field]: value } : sv) }));
  }

  function removeService(i: number) {
    setSettings(s => ({ ...s, services: s.services.filter((_, idx) => idx !== i) }));
  }

  function addFaq() {
    setSettings(s => ({ ...s, faqs: [...s.faqs, { question: "", answer: "" }] }));
  }

  function updateFaq(i: number, field: keyof FAQ, value: string) {
    setSettings(s => ({ ...s, faqs: s.faqs.map((f, idx) => idx === i ? { ...f, [field]: value } : f) }));
  }

  function removeFaq(i: number) {
    setSettings(s => ({ ...s, faqs: s.faqs.filter((_, idx) => idx !== i) }));
  }

  const inp = { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" } as const;
  const lbl = { color: "#555", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1e1e1e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/dashboard" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>← Dashboard</a>
          <div style={{ color: "#333" }}>|</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Configure AI Receptionist</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "9px 20px", background: saved ? "#1a2e1a" : "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 10, color: saved ? "#4ade80" : "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(["general", "services", "faqs"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid", borderColor: tab === t ? "#6b8cff" : "#222", background: tab === t ? "#6b8cff1a" : "#111", color: tab === t ? "#6b8cff" : "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>

        {tab === "general" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20 }}>AI Persona</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={lbl}>AI Name (what clients see)</label>
                  <input value={settings.ai_name} onChange={e => setSettings(s => ({ ...s, ai_name: e.target.value }))} style={inp} placeholder="e.g. Kiera's Assistant" />
                </div>
                <div>
                  <label style={lbl}>Opening Greeting</label>
                  <textarea value={settings.greeting} onChange={e => setSettings(s => ({ ...s, greeting: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Accent Color</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="color" value={settings.accent_color} onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))} style={{ width: 40, height: 36, padding: 2, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, cursor: "pointer" }} />
                    <input value={settings.accent_color} onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))} style={{ ...inp, width: 120 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20 }}>Policies & Booking</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={lbl}>Deposit Policy</label>
                  <textarea value={settings.deposit_policy} onChange={e => setSettings(s => ({ ...s, deposit_policy: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Cancellation Policy</label>
                  <textarea value={settings.cancellation_policy} onChange={e => setSettings(s => ({ ...s, cancellation_policy: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Booking Link (optional)</label>
                  <input value={settings.booking_link} onChange={e => setSettings(s => ({ ...s, booking_link: e.target.value }))} style={inp} placeholder="https://your-booking-link.com" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div>
            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: 700 }}>Your Services</div>
                <button onClick={addService} style={{ padding: "7px 14px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Service</button>
              </div>
              {settings.services.length === 0 && <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No services yet. Add your first service so the AI knows what to tell clients.</div>}
              {settings.services.map((sv, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr auto", gap: 10, marginBottom: 12, alignItems: "start" }}>
                  <input value={sv.name} onChange={e => updateService(i, "name", e.target.value)} placeholder="Service name" style={inp} />
                  <input value={sv.price} onChange={e => updateService(i, "price", e.target.value)} placeholder="$0" style={inp} />
                  <input value={sv.description} onChange={e => updateService(i, "description", e.target.value)} placeholder="Short description" style={inp} />
                  <button onClick={() => removeService(i)} style={{ padding: "10px 12px", background: "#2e1a1a", border: "1px solid #3a2020", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "faqs" && (
          <div>
            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: 700 }}>Custom FAQs</div>
                <button onClick={addFaq} style={{ padding: "7px 14px", background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add FAQ</button>
              </div>
              {settings.faqs.length === 0 && <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Add your most common client questions so the AI answers them perfectly.</div>}
              {settings.faqs.map((faq, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>FAQ {i + 1}</div>
                    <button onClick={() => removeFaq(i)} style={{ padding: "4px 10px", background: "#2e1a1a", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>Remove</button>
                  </div>
                  <input value={faq.question} onChange={e => updateFaq(i, "question", e.target.value)} placeholder="Question clients ask..." style={{ ...inp, marginBottom: 8 }} />
                  <textarea value={faq.answer} onChange={e => updateFaq(i, "answer", e.target.value)} placeholder="How the AI should answer..." rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
