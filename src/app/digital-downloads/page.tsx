"use client";

import { useState } from "react";

const TEMPLATES = [
  { id: "daily-planner", emoji: "📅", name: "Daily Planner", desc: "Hourly time blocks, priorities & notes" },
  { id: "weekly-planner", emoji: "📆", name: "Weekly Planner", desc: "Plan your full week at a glance" },
  { id: "habit-tracker", emoji: "✅", name: "Habit Tracker", desc: "31-day habit tracking grid" },
  { id: "budget-tracker", emoji: "💰", name: "Budget Tracker", desc: "Monthly income & expense tracker" },
  { id: "gratitude-journal", emoji: "🙏", name: "Gratitude Journal", desc: "Daily reflection & mindfulness" },
  { id: "meal-planner", emoji: "🍽️", name: "Meal Planner", desc: "Weekly meals & grocery list" },
  { id: "checklist", emoji: "📋", name: "Checklist", desc: "Custom to-do & checklist pages" },
  { id: "goal-setting", emoji: "🎯", name: "Goal Setting", desc: "Goal planning worksheet" },
];

export default function DigitalDownloads() {
  const [selected, setSelected] = useState("daily-planner");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [accentColor, setAccentColor] = useState("#6b8cff");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tpl = TEMPLATES.find(t => t.id === selected)!;

  async function generate() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selected,
          title: title || tpl.name,
          subtitle,
          accentColor,
          authorName,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected}-by-${(authorName || "me").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      alert("Error generating PDF. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fff", color: "#1a1a1a", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}`}</style>

      {/* Nav */}
      <nav style={{ padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>Apex <span style={{ background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studio</span></div>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/" style={{ color: "#888", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Home</a>
          <a href="/login" style={{ color: "#888", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Sign in</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f0f0ff 0%, #fdf0ff 100%)", padding: "48px 40px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #6b8cff33", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#6b8cff", fontWeight: 600, marginBottom: 20 }}>
          🛍️ Etsy-Ready Digital Downloads
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 12px" }}>Digital Product Maker</h1>
        <p style={{ color: "#666", fontSize: 16, margin: 0 }}>Create professional printable PDFs ready to sell on Etsy in seconds</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40 }}>

          {/* Left: Builder */}
          <div>
            {/* Step 1 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6b8cff, #c084fc)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Choose a Template</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelected(t.id)} style={{ padding: "14px 10px", borderRadius: 12, border: selected === t.id ? `2px solid #6b8cff` : "2px solid #e5e5e5", background: selected === t.id ? "#f0f0ff" : "#fff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: selected === t.id ? "#6b8cff" : "#333" }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: "#888", marginTop: 3, lineHeight: 1.4 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6b8cff, #c084fc)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Customize</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Title", value: title, setter: setTitle, placeholder: tpl.name },
                  { label: "Subtitle / Tagline", value: subtitle, setter: setSubtitle, placeholder: "e.g. Undated · A4 & Letter" },
                  { label: "Your Name / Brand", value: authorName, setter: setAuthorName, placeholder: "e.g. Pink Planner Co." },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontWeight: 600, fontSize: 12, color: "#555", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, outline: "none" }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 12, color: "#555", marginBottom: 6 }}>Accent Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 44, height: 40, border: "1px solid #e5e5e5", borderRadius: 10, cursor: "pointer", padding: 2 }} />
                    <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{accentColor}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["#6b8cff","#c084fc","#f472b6","#34d399","#fb923c","#e11d48"].map(c => (
                        <button key={c} onClick={() => setAccentColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: accentColor === c ? "2px solid #333" : "2px solid transparent", cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6b8cff, #c084fc)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Download Your PDF</div>
              </div>
              <button onClick={generate} disabled={loading} style={{ width: "100%", padding: "16px", background: loading ? "#ccc" : "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? (
                  <><span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating PDF...</>
                ) : done ? "✓ Downloaded! Generate Another" : `⬇ Generate & Download ${tpl.name} PDF`}
              </button>
              {done && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#f0fff4", border: "1px solid #86efac", borderRadius: 10, fontSize: 13, color: "#166534" }}>
                  ✓ Your PDF is ready! Upload it to your Etsy listing as a digital download.
                </div>
              )}
            </div>

            {/* Etsy tips */}
            <div style={{ marginTop: 32, padding: 20, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#92400e", marginBottom: 10 }}>💡 Etsy Selling Tips</div>
              <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#78350f", fontSize: 12, lineHeight: 1.8 }}>
                <li>Bundle 5–10 pages per listing for higher perceived value</li>
                <li>Generate both A4 and Letter sizes for international buyers</li>
                <li>Price printable packs between $3–$8 for best conversion</li>
                <li>Use your brand name consistently across all PDFs</li>
                <li>Include a usage note: "Personal & Commercial Use Included"</li>
              </ul>
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{ position: "sticky", top: 90 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: "#555" }}>PREVIEW</div>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(107,140,255,0.15)", border: "1px solid #e8e8ff", overflow: "hidden", aspectRatio: "0.77" }}>
              {/* Simulated PDF page */}
              <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ background: accentColor, padding: "16px 20px", flexShrink: 0 }}>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{title || tpl.name}</div>
                  {subtitle && <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 2 }}>{subtitle}</div>}
                </div>
                <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {tpl.id === "daily-planner" && <>
                    <div style={{ fontSize: 8, color: "#999" }}>DATE: _____________ DAY: _____________</div>
                    <PreviewSection label="TODAY'S PRIORITIES" color={accentColor}>
                      {[1,2,3].map(i => <PreviewLine key={i} checkbox />)}
                    </PreviewSection>
                    <PreviewSection label="TIME BLOCKS" color={accentColor}>
                      {["6 AM","8 AM","10 AM","12 PM","2 PM","4 PM"].map(t => <div key={t} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}><span style={{ fontSize: 7, color: "#999", width: 28 }}>{t}</span><div style={{ flex: 1, borderBottom: "0.5px solid #ddd" }} /></div>)}
                    </PreviewSection>
                    <PreviewSection label="NOTES" color={accentColor}>
                      {[1,2,3].map(i => <PreviewLine key={i} />)}
                    </PreviewSection>
                  </>}
                  {tpl.id === "weekly-planner" && <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                      {["M","T","W","T","F","S","S"].map((d,i) => <div key={i} style={{ background: accentColor + "20", borderRadius: 3, padding: "3px 2px", textAlign: "center", fontSize: 7, fontWeight: 700, color: accentColor }}>{d}</div>)}
                    </div>
                    {[1,2,3,4,5,6].map(r => <div key={r} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>{[0,1,2,3,4,5,6].map(d => <div key={d} style={{ borderBottom: "0.5px solid #ddd", height: 10 }} />)}</div>)}
                  </>}
                  {tpl.id === "habit-tracker" && <>
                    <div style={{ fontSize: 7, color: accentColor, fontWeight: 700 }}>HABIT TRACKER</div>
                    <div style={{ display: "grid", gridTemplateColumns: "60px repeat(15, 1fr)", gap: 1 }}>
                      <div style={{ fontSize: 6, color: "#999" }}>HABIT</div>
                      {Array.from({length:15},(_,i) => <div key={i} style={{ fontSize: 5, textAlign: "center", color: "#bbb" }}>{i+1}</div>)}
                      {[1,2,3,4,5,6].map(r => <>
                        <div key={`h${r}`} style={{ borderBottom: "0.5px solid #ddd", height: 12 }} />
                        {Array.from({length:15},(_,i) => <div key={i} style={{ border: "0.5px solid #ddd", height: 12 }} />)}
                      </>)}
                    </div>
                  </>}
                  {!["daily-planner","weekly-planner","habit-tracker"].includes(tpl.id) && <>
                    <div style={{ fontSize: 9, color: accentColor, fontWeight: 700, marginBottom: 4 }}>{tpl.name.toUpperCase()}</div>
                    {Array.from({length: 8}).map((_,i) => <PreviewLine key={i} checkbox={tpl.id === "checklist"} />)}
                    <div style={{ fontSize: 7, color: accentColor, fontWeight: 700, marginTop: 6 }}>NOTES</div>
                    {[1,2,3].map(i => <PreviewLine key={i} />)}
                  </>}
                </div>
                {authorName && <div style={{ padding: "6px 20px", borderTop: "0.5px solid #f0f0f0", fontSize: 7, color: "#bbb" }}>© {authorName}</div>}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8f8ff", borderRadius: 10, fontSize: 11, color: "#666", textAlign: "center" }}>
              📄 Letter size · 612 × 792 pt · High resolution
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PreviewSection({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 7, fontWeight: 700, color, marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  );
}

function PreviewLine({ checkbox }: { checkbox?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
      {checkbox && <div style={{ width: 7, height: 7, border: "0.5px solid #ccc", flexShrink: 0 }} />}
      <div style={{ flex: 1, borderBottom: "0.5px solid #ddd", height: 10 }} />
    </div>
  );
}
