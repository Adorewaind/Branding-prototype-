"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ROLES, eligibleStaff, formatShift, openShiftMessage, smsHref, staffLink, toShiftRange,
  type CrewLocation, type CrewShift, type CrewStaff,
} from "@/lib/crew";
import { C, card, chip, chipOn, input, label, page, primary, row, secondary, small, toastStyle, wrap } from "@/app/crew/ui";

type Tab = "shifts" | "crew";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function minutesAgo(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} days ago`;
}

export default function CrewManager() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "setup" | "ready">("loading");
  const [location, setLocation] = useState<CrewLocation | null>(null);
  const [staff, setStaff] = useState<CrewStaff[]>([]);
  const [shifts, setShifts] = useState<CrewShift[]>([]);
  const [tab, setTab] = useState<Tab>("shifts");
  const [sendFor, setSendFor] = useState<string | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [textingEnabled, setTextingEnabled] = useState(false);
  const [toast, setToast] = useState("");
  const [origin, setOrigin] = useState("");
  const [now, setNow] = useState(0);
  const lastStatus = useRef<Map<string, string> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }, []);

  const loadData = useCallback(async (loc: CrewLocation) => {
    const supabase = createClient();
    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const [{ data: st }, { data: sh }] = await Promise.all([
      supabase.from("crew_staff").select("*").eq("location_id", loc.id).order("name"),
      supabase.from("crew_shifts").select("*").eq("location_id", loc.id).gte("ends_at", since).order("starts_at"),
    ]);
    const staffList = (st ?? []) as CrewStaff[];
    const shiftList = (sh ?? []) as CrewShift[];

    // Tell the manager about anything that changed since the last poll.
    const prev = lastStatus.current;
    if (prev) {
      const nameOf = (id: string | null) => staffList.find(s => s.id === id)?.name ?? "Someone";
      for (const s of shiftList) {
        const before = prev.get(s.id);
        if (before === "open" && s.status === "covered") {
          const msg = `${nameOf(s.covered_by_staff_id)} is covering ${s.role}, ${formatShift(s.starts_at, s.ends_at)} ✅`;
          flash(msg);
          notify(msg);
        } else if (before === undefined && s.source === "staff") {
          const msg = `${nameOf(s.called_out_staff_id)} called out: ${s.role}, ${formatShift(s.starts_at, s.ends_at)}`;
          flash(msg);
          notify(msg);
        }
      }
    }
    lastStatus.current = new Map(shiftList.map(s => [s.id, s.status]));
    setStaff(staffList);
    setShifts(shiftList);
    setNow(Date.now());
  }, [flash]);

  useEffect(() => {
    // Read browser-only values after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    fetch("/api/crew/notify").then(r => r.json()).then(d => setTextingEnabled(!!d.enabled)).catch(() => {});

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: loc } = await supabase.from("crew_locations").select("id, name").order("created_at").limit(1).maybeSingle();
      if (!loc) { setState("setup"); return; }
      setLocation(loc);
      await loadData(loc);
      setState("ready");
    })();
  }, [router, loadData]);

  // Poll for call-outs and pickups once a location exists (including right after first-time setup).
  useEffect(() => {
    if (!location) return;
    const timer = setInterval(() => loadData(location), 15000);
    return () => clearInterval(timer);
  }, [location, loadData]);

  async function createLocation(name: string) {
    const { data, error } = await createClient().from("crew_locations").insert({ name }).select("id, name").single();
    if (error || !data) { flash("Couldn't save. Try again."); return; }
    setLocation(data);
    await loadData(data);
    setState("ready");
    setTab("crew");
  }

  async function updateShift(id: string, patch: Partial<CrewShift>, msg: string) {
    const { error } = await createClient().from("crew_shifts").update(patch).eq("id", id);
    if (error) { flash("Couldn't update. Try again."); return; }
    flash(msg);
    if (location) loadData(location);
  }

  if (state === "loading") {
    return <div style={page}><div style={{ ...wrap, paddingTop: 80, textAlign: "center", color: C.dim }}>Loading…</div></div>;
  }
  if (state === "setup" || !location) {
    return <Setup onCreate={createLocation} />;
  }

  const upcoming = shifts.filter(s => new Date(s.ends_at).getTime() > now && s.status !== "cancelled");
  const openCount = upcoming.filter(s => s.status === "open").length;
  const nameOf = (id: string | null) => staff.find(s => s.id === id)?.name;

  return (
    <div style={page}>
      <div style={wrap}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700, letterSpacing: 1 }}>CREW COVERAGE</div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{location.name}</h1>
          </div>
          <a href="/spot-check" style={{ ...chip, textDecoration: "none", fontSize: 13 }}>Spot-check →</a>
        </header>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTab("shifts")} style={chipOn(tab === "shifts")}>Shifts{openCount ? ` (${openCount} open)` : ""}</button>
          <button onClick={() => setTab("crew")} style={chipOn(tab === "crew")}>Crew ({staff.filter(s => s.active).length})</button>
        </div>

        {tab === "shifts" && (
          <>
            {!showPost ? (
              <button onClick={() => setShowPost(true)} style={{ ...primary, width: "100%", marginBottom: 14 }}>
                + Someone called out / need cover
              </button>
            ) : (
              <PostShift
                location={location}
                staff={staff}
                onCancel={() => setShowPost(false)}
                onPosted={shift => { setShowPost(false); setSendFor(shift.id); flash("Shift posted. Now send it to your crew."); loadData(location); }}
              />
            )}

            {staff.filter(s => s.active).length === 0 && (
              <div style={{ ...card, borderColor: C.amber }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Add your crew first</div>
                <div style={small}>Open shifts go to the people on your Crew tab.</div>
                <button onClick={() => setTab("crew")} style={{ ...secondary, marginTop: 10 }}>Go to Crew</button>
              </div>
            )}

            {upcoming.length === 0 ? (
              <div style={{ ...card, ...small }}>No open or covered shifts coming up.</div>
            ) : upcoming.map(s => {
              const coveredBy = nameOf(s.covered_by_staff_id);
              const calledOut = nameOf(s.called_out_staff_id);
              return (
                <section key={s.id} style={{ ...card, borderColor: s.status === "open" ? C.amber : C.line }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{s.role}</div>
                      <div>{formatShift(s.starts_at, s.ends_at)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {s.status === "open"
                        ? <span style={{ color: C.amber, fontWeight: 800 }}>OPEN</span>
                        : <span style={{ color: C.green, fontWeight: 800 }}>COVERED ✅</span>}
                      {Number(s.bonus) > 0 && <div style={{ color: C.amber, fontSize: 13 }}>+${Number(s.bonus)} bonus</div>}
                    </div>
                  </div>
                  <div style={{ ...small, marginTop: 6 }}>
                    {calledOut ? `${calledOut} called out` : "Extra help needed"}
                    {s.source === "staff" ? " (through the app)" : ""} · posted {minutesAgo(s.created_at)}
                    {s.note ? ` · "${s.note}"` : ""}
                  </div>
                  {coveredBy && <div style={{ marginTop: 6, fontWeight: 700 }}>{coveredBy} is covering{s.covered_at ? ` (took it ${minutesAgo(s.covered_at)})` : ""}</div>}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {s.status === "open" && (
                      <>
                        <button onClick={() => setSendFor(sendFor === s.id ? null : s.id)} style={{ ...primary, padding: "10px 14px", fontSize: 14 }}>
                          {sendFor === s.id ? "Hide" : "Send to crew"}
                        </button>
                        <button onClick={() => updateShift(s.id, { bonus: Number(s.bonus) + 10 }, "Added $10 bonus. Resend so they see it.")} style={{ ...secondary, padding: "10px 14px", fontSize: 14 }}>
                          +$10 bonus
                        </button>
                        <button onClick={() => updateShift(s.id, { status: "cancelled" }, "Shift cancelled.")} style={{ ...secondary, padding: "10px 14px", fontSize: 14 }}>
                          Cancel
                        </button>
                      </>
                    )}
                    {s.status === "covered" && (
                      <button
                        onClick={() => updateShift(s.id, { status: "open", covered_by_staff_id: null, covered_at: null }, "Shift reopened.")}
                        style={{ ...secondary, padding: "10px 14px", fontSize: 14 }}
                      >
                        Reopen
                      </button>
                    )}
                  </div>

                  {sendFor === s.id && s.status === "open" && (
                    <SendPanel shift={s} staff={staff} location={location} origin={origin} textingEnabled={textingEnabled} onToast={flash} />
                  )}
                </section>
              );
            })}
          </>
        )}

        {tab === "crew" && <CrewTab location={location} staff={staff} shifts={shifts} origin={origin} onChange={() => loadData(location)} onToast={flash} />}
      </div>
      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  );
}

function notify(msg: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(msg);
  } catch { /* notifications unavailable */ }
}

function Setup({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div style={page}>
      <div style={{ ...wrap, paddingTop: 48 }}>
        <div style={{ fontSize: 12, color: C.green, fontWeight: 700, letterSpacing: 1 }}>CREW COVERAGE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Stop working doubles.</h1>
        <p style={{ ...small, fontSize: 15, marginBottom: 20 }}>
          When someone calls out, post the shift once. Your crew gets a link, the first person to tap takes it, and you get told who&apos;s covering.
        </p>
        <section style={card}>
          <label style={label}>What&apos;s your restaurant called?</label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Joe's Grill" style={{ ...input, marginBottom: 12 }} />
          <button onClick={() => name.trim() && onCreate(name.trim())} disabled={!name.trim()} style={{ ...primary, width: "100%", opacity: name.trim() ? 1 : 0.5 }}>
            Get started
          </button>
        </section>
      </div>
    </div>
  );
}

function PostShift({ location, staff, onCancel, onPosted }: {
  location: CrewLocation; staff: CrewStaff[]; onCancel: () => void; onPosted: (s: CrewShift) => void;
}) {
  const [role, setRole] = useState(ROLES[0]);
  const [date, setDate] = useState(today());
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("22:00");
  const [calledOut, setCalledOut] = useState("");
  const [bonus, setBonus] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const range = toShiftRange(date, start, end);
    if (!range) { setError("Fill in the date and times."); return; }
    setBusy(true);
    const { data, error: dbError } = await createClient().from("crew_shifts").insert({
      location_id: location.id,
      role,
      ...range,
      called_out_staff_id: calledOut || null,
      bonus: Math.max(0, Number(bonus) || 0),
      note: note.trim() || null,
    }).select("*").single();
    setBusy(false);
    if (dbError || !data) { setError("Couldn't post the shift. Try again."); return; }
    onPosted(data as CrewShift);
  }

  return (
    <section style={{ ...card, borderColor: C.green }}>
      <label style={label}>Post a shift that needs cover</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {ROLES.map(r => <button key={r} onClick={() => setRole(r)} style={chipOn(r === role)}>{r}</button>)}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...input, gridColumn: "1 / -1" }} />
        <input type="time" value={start} onChange={e => setStart(e.target.value)} style={input} aria-label="Start time" />
        <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={input} aria-label="End time" />
        <select value={calledOut} onChange={e => setCalledOut(e.target.value)} style={{ ...input, gridColumn: "1 / -1" }}>
          <option value="">Nobody called out, need extra help</option>
          {staff.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} called out</option>)}
        </select>
        <input type="number" inputMode="decimal" min={0} value={bonus} onChange={e => setBonus(e.target.value)} placeholder="Bonus $ (optional)" style={input} />
        <input value={note} onChange={e => setNote(e.target.value)} maxLength={280} placeholder="Note (optional)" style={input} />
      </div>
      {error && <div style={{ color: C.red, fontSize: 14, marginBottom: 10 }}>{error}</div>}
      <div style={row}>
        <button onClick={onCancel} style={{ ...secondary, flex: 1 }}>Cancel</button>
        <button onClick={submit} disabled={busy} style={{ ...primary, flex: 2 }}>{busy ? "Posting…" : "Post shift"}</button>
      </div>
    </section>
  );
}

function SendPanel({ shift, staff, location, origin, textingEnabled, onToast }: {
  shift: CrewShift; staff: CrewStaff[]; location: CrewLocation; origin: string; textingEnabled: boolean; onToast: (m: string) => void;
}) {
  const [sending, setSending] = useState(false);
  const people = eligibleStaff(staff, shift);

  async function textEveryone() {
    setSending(true);
    try {
      const res = await fetch("/api/crew/notify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shiftId: shift.id }),
      });
      const d = await res.json();
      onToast(res.ok ? `Texted ${d.sent} ${d.sent === 1 ? "person" : "people"}${d.skipped ? ` (${d.skipped} missing a phone number)` : ""}` : d.error || "Couldn't send texts");
    } catch {
      onToast("Couldn't send texts");
    } finally {
      setSending(false);
    }
  }

  if (people.length === 0) {
    return <div style={{ ...small, marginTop: 12 }}>Nobody on your crew has the {shift.role} position. Add it on the Crew tab.</div>;
  }

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
      {textingEnabled ? (
        <button onClick={textEveryone} disabled={sending} style={{ ...primary, width: "100%", marginBottom: 10 }}>
          {sending ? "Texting…" : `Text all ${people.length} automatically`}
        </button>
      ) : (
        <div style={{ ...small, marginBottom: 10 }}>Tap each name to open a text with their personal link already written.</div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {people.map(p => {
          const msg = openShiftMessage(location.name, shift, staffLink(origin, p.token));
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span>{p.name}</span>
              {p.phone ? (
                <a href={smsHref(p.phone, msg)} style={{ ...secondary, padding: "8px 12px", fontSize: 14 }}>Text {p.name.split(" ")[0]}</a>
              ) : (
                <button
                  onClick={() => { navigator.clipboard?.writeText(msg); onToast(`Copied ${p.name}'s message`); }}
                  style={{ ...secondary, padding: "8px 12px", fontSize: 14 }}
                >
                  Copy message
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrewTab({ location, staff, shifts, origin, onChange, onToast }: {
  location: CrewLocation; staff: CrewStaff[]; shifts: CrewShift[]; origin: string; onChange: () => void; onToast: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await createClient().from("crew_staff").insert({
      location_id: location.id, name: name.trim(), phone: phone.trim() || null, roles,
    });
    setBusy(false);
    if (error) { onToast("Couldn't add. Try again."); return; }
    onToast(`${name.trim()} added. Text them their link.`);
    setName(""); setPhone(""); setRoles([]);
    onChange();
  }

  async function remove(s: CrewStaff) {
    if (!confirm(`Remove ${s.name}? Their link will stop working.`)) return;
    const { error } = await createClient().from("crew_staff").update({ active: false }).eq("id", s.id);
    if (error) { onToast("Couldn't remove. Try again."); return; }
    onChange();
  }

  const covers = (id: string) => shifts.filter(s => s.covered_by_staff_id === id && s.status === "covered").length;
  const callouts = (id: string) => shifts.filter(s => s.called_out_staff_id === id && s.status !== "cancelled").length;

  return (
    <>
      <section style={card}>
        <label style={label}>Add someone to your crew</label>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Name" style={input} />
          <input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} type="tel" placeholder="Cell number" style={input} />
        </div>
        <div style={{ ...small, marginBottom: 8 }}>Positions they can work</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoles(v => v.includes(r) ? v.filter(x => x !== r) : [...v, r])} style={chipOn(roles.includes(r))}>{r}</button>
          ))}
        </div>
        <button onClick={add} disabled={busy || !name.trim()} style={{ ...primary, width: "100%", opacity: name.trim() ? 1 : 0.5 }}>Add to crew</button>
      </section>

      {staff.filter(s => s.active).map(s => {
        const link = staffLink(origin, s.token);
        const welcome = `Hi ${s.name.split(" ")[0]}! This is your link for ${location.name} shifts. Pick up open shifts or call out here: ${link}`;
        return (
          <section key={s.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{s.name}</div>
                <div style={small}>{s.roles.length ? s.roles.join(", ") : "Any position"}{s.phone ? ` · ${s.phone}` : ""}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13 }}>
                <div style={{ color: C.green }}>{covers(s.id)} covered</div>
                <div style={{ color: callouts(s.id) >= 3 ? C.red : C.dim }}>{callouts(s.id)} call-outs</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {s.phone && <a href={smsHref(s.phone, welcome)} style={{ ...secondary, padding: "8px 12px", fontSize: 14 }}>Text their link</a>}
              <button onClick={() => { navigator.clipboard?.writeText(link); onToast("Link copied"); }} style={{ ...secondary, padding: "8px 12px", fontSize: 14 }}>Copy link</button>
              <button onClick={() => remove(s)} style={{ ...secondary, padding: "8px 12px", fontSize: 14, color: C.red }}>Remove</button>
            </div>
          </section>
        );
      })}
      <p style={{ ...small, textAlign: "center", fontSize: 12 }}>Covers and call-outs are counted over the last 90 days.</p>
    </>
  );
}
