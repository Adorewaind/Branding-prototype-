"use client";

import { useState, useEffect } from "react";

const STATUSES = ["Not Contacted", "DM Sent", "Responded", "Demo Scheduled", "Trial Started", "Paying Client", "Not Interested"];
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Not Contacted": { bg: "#1e1e1e", text: "#555", dot: "#333" },
  "DM Sent": { bg: "#1a1a2e", text: "#6b8cff", dot: "#6b8cff" },
  "Responded": { bg: "#1a2e1a", text: "#4ade80", dot: "#4ade80" },
  "Demo Scheduled": { bg: "#2e2a1a", text: "#f59e0b", dot: "#f59e0b" },
  "Trial Started": { bg: "#2e1a2e", text: "#c084fc", dot: "#c084fc" },
  "Paying Client": { bg: "#1a2e1a", text: "#4ade80", dot: "#4ade80" },
  "Not Interested": { bg: "#2e1a1a", text: "#f87171", dot: "#f87171" },
};

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "Cold Call", "Walk In", "Referral", "Facebook Group"];
const BUSINESS_TYPES = ["Lash Tech", "Microblading", "PMU Artist", "Nail Tech", "Esthetician", "Hair Salon", "Massage", "Spray Tan", "Dentist", "Chiropractor", "HVAC/Plumber", "Real Estate", "Photographer", "Other"];

const SAMPLE_LEADS = [
  { id: 1, name: "Lash By Kiera", owner: "Kiera Johnson", platform: "Instagram", handle: "@lashbykiera", businessType: "Lash Tech", status: "Responded", location: "Atlanta, GA", notes: "Interested! Asked about pricing", lastContact: "2025-05-20", followUpDate: "2025-05-22" },
  { id: 2, name: "Brow Studio by Mia", owner: "Mia Torres", platform: "Instagram", handle: "@browsbymiaa", businessType: "Microblading", status: "DM Sent", location: "Houston, TX", notes: "Sent intro DM", lastContact: "2025-05-21", followUpDate: "2025-05-23" },
  { id: 3, name: "Glam Nails & Co", owner: "Sandra K", platform: "Facebook", handle: "Glam Nails & Co", businessType: "Nail Tech", status: "Demo Scheduled", location: "Dallas, TX", notes: "Zoom call Thursday 2pm", lastContact: "2025-05-19", followUpDate: "2025-05-23" },
  { id: 4, name: "Bella PMU", owner: "Isabella Cruz", platform: "Cold Call", handle: "(555) 123-4567", businessType: "PMU Artist", status: "Not Contacted", location: "Miami, FL", notes: "Found on StyleSeat", lastContact: "", followUpDate: "2025-05-22" },
  { id: 5, name: "The Lash Lounge", owner: "Ashley M", platform: "TikTok", handle: "@lashloungeashley", businessType: "Lash Tech", status: "Paying Client", location: "Phoenix, AZ", notes: "Signed up! $79/mo ✓", lastContact: "2025-05-18", followUpDate: "" },
];

interface Lead {
  id: number;
  name: string;
  owner: string;
  platform: string;
  handle: string;
  businessType: string;
  status: string;
  location: string;
  notes: string;
  lastContact: string;
  followUpDate: string;
}

const EMPTY_LEAD: Omit<Lead, "id"> = { name: "", owner: "", platform: "Instagram", handle: "", businessType: "Lash Tech", status: "Not Contacted", location: "", notes: "", lastContact: "", followUpDate: "" };

const DM_SCRIPTS = [
  {
    title: "Instagram DM — Lash & Brow Techs",
    color: "#c084fc",
    script: `Hey [Name]! Your work is gorgeous 😍 Quick question — do you ever miss DMs or texts from clients while you're in the middle of a set? I built an AI receptionist specifically for solo beauty pros — it answers client questions, handles new client intake, and captures bookings 24/7 even while your hands are full. Takes 10 min to set up. Can I send you a 2-min video?`,
  },
  {
    title: "Cold Call Script",
    color: "#6b8cff",
    script: `"Hi, is this the owner? Great — this is [your name], I'm local and I built an AI tool that handles customer messages and appointment requests 24/7 so you never miss a lead. Takes 10 minutes to set up on your website. Can I send you a quick 2-minute video to show you how it works?"`,
  },
  {
    title: "Follow-Up (If No Response After 3 Days)",
    color: "#4ade80",
    script: `"Hey [Name]! Just wanted to bump this up in case it got buried 😊 I actually set up a demo specifically for [their business type] — it already knows your most common FAQs, pricing questions, and booking flow. Takes 2 min to watch. Want me to send it over?"`,
  },
  {
    title: "After They Watch The Demo",
    color: "#f59e0b",
    script: `"Hey! Did you get a chance to watch the demo? Happy to set it up live on your website so you can see it working with YOUR info. First month is completely free — no card needed. Takes about 10 minutes on a quick call. When's a good time this week?"`,
  },
  {
    title: "Facebook Group Post",
    color: "#f472b6",
    script: `"I built an AI receptionist for solo beauty pros — lash techs, brow artists, estheticians. It answers client questions, collects new client intake forms, shares your pricing, and captures booking requests 24/7 — even while you're mid-set. Costs less than $80/month. Offering free 30-day trials to the first 3 techs in this group. Drop a 💅 below or DM me if you want in!"`,
  },
];

export default function TrackerPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Lead, "id">>(EMPTY_LEAD);
  const [activeTab, setActiveTab] = useState("tracker");
  const [sortBy, setSortBy] = useState("followUpDate");
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("outreach-leads");
    setLeads(saved ? JSON.parse(saved) : SAMPLE_LEADS);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (leads.length > 0) localStorage.setItem("outreach-leads", JSON.stringify(leads));
  }, [leads]);

  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase();
      return (
        (l.name.toLowerCase().includes(q) || l.owner.toLowerCase().includes(q) || l.handle.toLowerCase().includes(q) || l.location.toLowerCase().includes(q)) &&
        (filterStatus === "All" || l.status === filterStatus) &&
        (filterType === "All" || l.businessType === filterType)
      );
    })
    .sort((a, b) => {
      if (sortBy === "followUpDate") return (a.followUpDate || "9999") > (b.followUpDate || "9999") ? 1 : -1;
      if (sortBy === "status") return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      return a.name > b.name ? 1 : -1;
    });

  const stats = {
    total: leads.length,
    dmSent: leads.filter(l => l.status === "DM Sent").length,
    responded: leads.filter(l => l.status === "Responded").length,
    paying: leads.filter(l => l.status === "Paying Client").length,
    followUpToday: leads.filter(l => l.followUpDate === today && l.status !== "Paying Client" && l.status !== "Not Interested").length,
    demoScheduled: leads.filter(l => l.status === "Demo Scheduled").length,
  };
  const MRR = stats.paying * 79;

  function saveForm() {
    if (!form.name) return;
    if (editing !== null) {
      setLeads(leads.map(l => l.id === editing ? { ...form, id: editing } : l));
      setEditing(null);
    } else {
      setLeads([...leads, { ...form, id: Date.now() }]);
    }
    setForm(EMPTY_LEAD);
    setShowAdd(false);
  }

  function startEdit(lead: Lead) {
    setForm(lead);
    setEditing(lead.id);
    setShowAdd(true);
  }

  function deleteLead(id: number) {
    if (confirm("Delete this lead?")) setLeads(leads.filter(l => l.id !== id));
  }

  function updateStatus(id: number, status: string) {
    setLeads(leads.map(l => l.id === id ? { ...l, status, lastContact: today } : l));
  }

  function copyScript(text: string, title: string) {
    navigator.clipboard.writeText(text);
    setCopiedScript(title);
    setTimeout(() => setCopiedScript(null), 2000);
  }

  const inp = { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" } as const;
  const lbl = { color: "#555", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#080808", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pop { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#0d0d0d", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div style={{ padding: "0 20px 32px" }}>
          <a href="/" style={{ display: "block", color: "#333", fontSize: 10, marginBottom: 8, textDecoration: "none" }}>← All Apps</a>
          <div style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg, #6b8cff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OutreachHQ</div>
          <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>AI Receptionist Sales Tracker</div>
        </div>

        {[
          { id: "tracker", icon: "📋", label: "Lead Tracker" },
          { id: "pipeline", icon: "📊", label: "Pipeline" },
          { id: "scripts", icon: "💬", label: "DM Scripts" },
          { id: "followups", icon: "🔔", label: `Follow-ups (${stats.followUpToday})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 20px", border: "none", cursor: "pointer",
            background: activeTab === t.id ? "#1e1e1e" : "transparent",
            color: activeTab === t.id ? "#6b8cff" : "#555",
            fontSize: 13, fontWeight: 600, textAlign: "left", transition: "all 0.15s",
            borderLeft: activeTab === t.id ? "2px solid #6b8cff" : "2px solid transparent",
          }}><span>{t.icon}</span>{t.label}</button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>${MRR}</div>
            <div style={{ color: "#333", fontSize: 11, marginTop: 4 }}>{stats.paying} clients × $79</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 16, background: "#0a0a0a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, flex: 1 }}>
            {[
              { label: "Total Leads", value: stats.total, color: "#6b8cff" },
              { label: "DMs Sent", value: stats.dmSent, color: "#60a5fa" },
              { label: "Responded", value: stats.responded, color: "#4ade80" },
              { label: "Demos", value: stats.demoScheduled, color: "#f59e0b" },
              { label: "Follow Up Today", value: stats.followUpToday, color: "#f87171" },
              { label: "Paying Clients", value: stats.paying, color: "#4ade80" },
            ].map(s => (
              <div key={s.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 14px", borderTop: `2px solid ${s.color}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                <div style={{ color: "#444", fontSize: 10, marginTop: 3, fontWeight: 600 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { setForm(EMPTY_LEAD); setEditing(null); setShowAdd(true); }} style={{
            padding: "12px 22px", background: "linear-gradient(135deg, #6b8cff, #c084fc)",
            border: "none", borderRadius: 10, color: "#fff", fontWeight: 700,
            cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
          }}>+ Add Lead</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>

          {/* LEAD TRACKER */}
          {activeTab === "tracker" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search leads..." style={{ ...inp, width: 220 }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: "auto" }}>
                  <option>All</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp, width: "auto" }}>
                  <option>All</option>
                  {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width: "auto" }}>
                  <option value="followUpDate">Sort: Follow-up</option>
                  <option value="status">Sort: Status</option>
                  <option value="name">Sort: Name</option>
                </select>
                <span style={{ color: "#444", fontSize: 12, display: "flex", alignItems: "center" }}>{filtered.length} leads</span>
              </div>

              <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1.5fr 1fr 140px", padding: "12px 20px", borderBottom: "1px solid #1e1e1e", background: "#111" }}>
                  {["Business", "Owner/Handle", "Type", "Status", "Notes", "Follow Up", "Actions"].map(h => (
                    <div key={h} style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                  ))}
                </div>

                {filtered.map((lead, i) => {
                  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS["Not Contacted"];
                  const isOverdue = lead.followUpDate && lead.followUpDate < today;
                  const isDueToday = lead.followUpDate === today;
                  return (
                    <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1.5fr 1fr 140px", padding: "14px 20px", borderBottom: "1px solid #111", background: i % 2 === 0 ? "#0d0d0d" : "#0a0a0a", animation: "slideIn 0.2s ease" }}>
                      <div>
                        <div style={{ color: "#ddd", fontWeight: 600, fontSize: 13 }}>{lead.name}</div>
                        <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>{lead.platform} • {lead.location}</div>
                      </div>
                      <div>
                        <div style={{ color: "#888", fontSize: 12 }}>{lead.owner}</div>
                        <div style={{ color: "#555", fontSize: 11 }}>{lead.handle}</div>
                      </div>
                      <div style={{ color: "#666", fontSize: 12, display: "flex", alignItems: "center" }}>{lead.businessType}</div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${sc.dot}44`, background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ color: "#666", fontSize: 12, display: "flex", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.notes || "—"}</div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {lead.followUpDate ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? "#f87171" : isDueToday ? "#f59e0b" : "#555", fontFamily: "'DM Mono', monospace" }}>
                            {isOverdue ? "⚠️ " : isDueToday ? "🔔 " : ""}{lead.followUpDate}
                          </span>
                        ) : <span style={{ color: "#333", fontSize: 11 }}>—</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button onClick={() => startEdit(lead)} style={{ padding: "5px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => deleteLead(lead.id)} style={{ padding: "5px 10px", background: "#2e1a1a", border: "1px solid #3a2020", borderRadius: 6, color: "#f87171", fontSize: 11, cursor: "pointer" }}>Del</button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div style={{ padding: 48, textAlign: "center", color: "#333" }}>No leads found. Add your first lead! 🚀</div>}
              </div>
            </div>
          )}

          {/* PIPELINE */}
          {activeTab === "pipeline" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Sales Pipeline</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Contacted", statuses: ["DM Sent"], color: "#6b8cff" },
                  { label: "Warm", statuses: ["Responded"], color: "#4ade80" },
                  { label: "Hot", statuses: ["Demo Scheduled", "Trial Started"], color: "#f59e0b" },
                  { label: "Closed", statuses: ["Paying Client"], color: "#4ade80" },
                ].map(col => {
                  const colLeads = leads.filter(l => col.statuses.includes(l.status));
                  return (
                    <div key={col.label} style={{ background: "#0d0d0d", border: `1px solid ${col.color}22`, borderRadius: 16, padding: 16, borderTop: `3px solid ${col.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ color: col.color, fontWeight: 700, fontSize: 13 }}>{col.label}</div>
                        <div style={{ background: `${col.color}22`, color: col.color, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{colLeads.length}</div>
                      </div>
                      {colLeads.length === 0
                        ? <div style={{ color: "#333", fontSize: 12, textAlign: "center", padding: "20px 0" }}>Empty</div>
                        : colLeads.map(l => (
                          <div key={l.id} style={{ background: "#151515", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                            <div style={{ color: "#ddd", fontWeight: 600, fontSize: 13 }}>{l.name}</div>
                            <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>{l.businessType} • {l.platform}</div>
                            {l.notes && <div style={{ color: "#444", fontSize: 11, marginTop: 6, fontStyle: "italic" }}>{l.notes}</div>}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DM SCRIPTS */}
          {activeTab === "scripts" && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>DM Scripts That Work 💬</h2>
              {DM_SCRIPTS.map(s => (
                <div key={s.title} style={{ background: "#0d0d0d", border: `1px solid ${s.color}33`, borderRadius: 16, padding: 24, marginBottom: 16, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{s.title}</div>
                  <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7, background: "#111", padding: 16, borderRadius: 10, border: "1px solid #1e1e1e" }}>{s.script}</div>
                  <button onClick={() => copyScript(s.script, s.title)} style={{ marginTop: 12, padding: "7px 16px", background: "#1e1e1e", border: `1px solid ${s.color}44`, borderRadius: 8, color: copiedScript === s.title ? "#4ade80" : s.color, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    {copiedScript === s.title ? "✓ Copied!" : "Copy Script"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* FOLLOW-UPS */}
          {activeTab === "followups" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Follow-Ups Due 🔔</h2>
              <p style={{ color: "#555", marginBottom: 24, fontSize: 13 }}>Leads that need attention today or are overdue.</p>
              {(() => {
                const due = leads.filter(l => l.followUpDate && l.followUpDate <= today && l.status !== "Paying Client" && l.status !== "Not Interested");
                if (due.length === 0) return (
                  <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16, padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <div style={{ color: "#555" }}>You&apos;re all caught up! No follow-ups due.</div>
                  </div>
                );
                return due.map(l => {
                  const isOverdue = l.followUpDate < today;
                  return (
                    <div key={l.id} style={{ background: "#0d0d0d", border: `1px solid ${isOverdue ? "#f87171" : "#f59e0b"}44`, borderRadius: 14, padding: 20, marginBottom: 12, borderLeft: `3px solid ${isOverdue ? "#f87171" : "#f59e0b"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{l.name}</div>
                          <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{l.businessType} • {l.platform} • {l.handle}</div>
                          {l.notes && <div style={{ color: "#888", fontSize: 13, marginTop: 8, fontStyle: "italic" }}>&quot;{l.notes}&quot;</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: isOverdue ? "#f87171" : "#f59e0b", fontWeight: 700, fontSize: 12 }}>{isOverdue ? "⚠️ OVERDUE" : "🔔 DUE TODAY"}</div>
                          <div style={{ color: "#444", fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{l.followUpDate}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button onClick={() => updateStatus(l.id, "Responded")} style={{ padding: "7px 14px", background: "#1a2e1a", border: "1px solid #4ade8044", borderRadius: 8, color: "#4ade80", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✓ They Responded</button>
                        <button onClick={() => updateStatus(l.id, "Demo Scheduled")} style={{ padding: "7px 14px", background: "#2e2a1a", border: "1px solid #f59e0b44", borderRadius: 8, color: "#f59e0b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>📅 Demo Booked</button>
                        <button onClick={() => updateStatus(l.id, "Not Interested")} style={{ padding: "7px 14px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#555", fontSize: 12, cursor: "pointer" }}>Pass</button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, width: 540, maxHeight: "85vh", overflowY: "auto", animation: "pop 0.2s ease" }}>
            <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 24 }}>{editing ? "Edit Lead" : "Add New Lead"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                { label: "Business Name *", key: "name", full: true },
                { label: "Owner Name", key: "owner" },
                { label: "Handle / Phone", key: "handle" },
                { label: "Location", key: "location" },
                { label: "Notes", key: "notes", full: true },
                { label: "Last Contact Date", key: "lastContact", type: "date" },
                { label: "Follow-Up Date", key: "followUpDate", type: "date" },
              ] as Array<{ label: string; key: keyof typeof form; full?: boolean; type?: string }>).map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                  <label style={lbl}>{f.label}</label>
                  <input type={f.type || "text"} value={form[f.key] as string} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
              {([
                { label: "Platform", key: "platform", options: PLATFORMS },
                { label: "Business Type", key: "businessType", options: BUSINESS_TYPES },
                { label: "Status", key: "status", options: STATUSES },
              ] as Array<{ label: string; key: keyof typeof form; options: string[] }>).map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <select value={form[f.key] as string} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={saveForm} style={{ flex: 1, padding: 13, background: "linear-gradient(135deg, #6b8cff, #c084fc)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                {editing ? "Save Changes" : "Add Lead"}
              </button>
              <button onClick={() => { setShowAdd(false); setEditing(null); setForm(EMPTY_LEAD); }} style={{ padding: "13px 20px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 12, color: "#888", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
