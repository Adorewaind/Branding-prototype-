"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLES, formatShift, toShiftRange } from "@/lib/crew";
import { C, card, chipOn, input, label, page, primary, row, secondary, small, toastStyle, wrap } from "../ui";

interface ViewShift { id: string; role: string; starts_at: string; ends_at: string; bonus?: number; note?: string | null; status?: string; }
interface StaffViewData {
  name: string;
  roles: string[];
  location: string;
  open_shifts: ViewShift[];
  my_covers: ViewShift[];
  my_callouts: ViewShift[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StaffView({ token }: { token: string }) {
  const [data, setData] = useState<StaffViewData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [showCallOut, setShowCallOut] = useState(false);

  const load = useCallback(async () => {
    if (!UUID.test(token)) { setState("invalid"); return; }
    const { data: view, error } = await createClient().rpc("crew_staff_view", { p_token: token });
    if (error) { setState("error"); return; }
    if (!view) { setState("invalid"); return; }
    setData(view as StaffViewData);
    setState("ready");
  }, [token]);

  useEffect(() => {
    // Initial fetch plus a light poll so newly posted shifts show up.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function claim(id: string) {
    setBusy(id);
    const { data: res, error } = await createClient().rpc("crew_claim_shift", { p_token: token, p_shift_id: id });
    setBusy(null);
    flash(error ? "Something went wrong. Try again." : (res as { message: string }).message);
    load();
  }

  if (state !== "ready" || !data) {
    const msg = state === "loading" ? "Loading your shifts…"
      : state === "invalid" ? "This link isn't active. Ask your manager to send you a new one."
      : "Couldn't load shifts. Check your signal and refresh.";
    return <div style={page}><div style={{ ...wrap, paddingTop: 80, textAlign: "center", color: C.dim }}>{msg}</div></div>;
  }

  return (
    <div style={page}>
      <div style={wrap}>
        <header style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 700, letterSpacing: 1 }}>{data.location.toUpperCase()}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Hi {data.name} 👋</h1>
        </header>

        <section style={card}>
          <label style={label}>Open shifts you can pick up</label>
          {data.open_shifts.length === 0 ? (
            <div style={small}>Nothing open right now. You&apos;ll get a text when a shift opens up.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {data.open_shifts.map(s => (
                <div key={s.id} style={{ border: `1px solid ${C.green}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{s.role}</div>
                    {Number(s.bonus) > 0 && <div style={{ color: C.amber, fontWeight: 800 }}>+${Number(s.bonus)} bonus</div>}
                  </div>
                  <div style={{ marginTop: 4 }}>{formatShift(s.starts_at, s.ends_at)}</div>
                  {s.note && <div style={{ ...small, marginTop: 4 }}>{s.note}</div>}
                  <button onClick={() => claim(s.id)} disabled={busy === s.id} style={{ ...primary, width: "100%", marginTop: 12 }}>
                    {busy === s.id ? "Grabbing it…" : "I'll take it"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {data.my_covers.length > 0 && (
          <section style={card}>
            <label style={label}>Shifts you picked up ✅</label>
            {data.my_covers.map(s => (
              <div key={s.id} style={{ padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
                <b>{s.role}</b> · {formatShift(s.starts_at, s.ends_at)}
                {Number(s.bonus) > 0 && <span style={{ color: C.amber }}> · +${Number(s.bonus)}</span>}
              </div>
            ))}
          </section>
        )}

        <section style={card}>
          {!showCallOut ? (
            <button onClick={() => setShowCallOut(true)} style={{ ...secondary, width: "100%" }}>Can&apos;t make a shift? Call out here</button>
          ) : (
            <CallOutForm
              token={token}
              roles={data.roles.length ? data.roles : ROLES}
              onDone={msg => { setShowCallOut(false); flash(msg); load(); }}
              onCancel={() => setShowCallOut(false)}
            />
          )}
          {data.my_callouts.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ ...small, marginBottom: 6 }}>Your call-outs</div>
              {data.my_callouts.map(s => (
                <div key={s.id} style={{ padding: "8px 0", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{s.role} · {formatShift(s.starts_at, s.ends_at)}</span>
                  <span style={{ color: s.status === "covered" ? C.green : C.amber, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {s.status === "covered" ? "Covered ✅" : "Finding cover…"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p style={{ ...small, textAlign: "center", fontSize: 12 }}>This link is just for you. Don&apos;t share it.</p>
      </div>
      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  );
}

function CallOutForm({ token, roles, onDone, onCancel }: { token: string; roles: string[]; onDone: (msg: string) => void; onCancel: () => void }) {
  const [role, setRole] = useState(roles[0]);
  const [date, setDate] = useState(today());
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("22:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const range = toShiftRange(date, start, end);
    if (!range) { setError("Fill in the date and times."); return; }
    setBusy(true);
    setError("");
    const { data: res, error: rpcError } = await createClient().rpc("crew_call_out", {
      p_token: token, p_role: role, p_starts_at: range.starts_at, p_ends_at: range.ends_at, p_note: note,
    });
    setBusy(false);
    if (rpcError) { setError("Something went wrong. Try again."); return; }
    const r = res as { ok: boolean; message: string };
    if (!r.ok) { setError(r.message); return; }
    onDone(r.message);
  }

  return (
    <div>
      <label style={label}>Call out of a shift</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {roles.map(r => <button key={r} onClick={() => setRole(r)} style={chipOn(r === role)}>{r}</button>)}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 10 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...input, gridColumn: "1 / -1" }} />
        <span style={{ ...small, alignSelf: "center" }}>From</span>
        <input type="time" value={start} onChange={e => setStart(e.target.value)} style={{ ...input, gridColumn: "2 / 4" }} />
        <span style={{ ...small, alignSelf: "center" }}>To</span>
        <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={{ ...input, gridColumn: "2 / 4" }} />
      </div>
      <input value={note} onChange={e => setNote(e.target.value)} maxLength={280} placeholder="Reason (optional)" style={{ ...input, marginBottom: 12 }} />
      {error && <div style={{ color: C.red, fontSize: 14, marginBottom: 10 }}>{error}</div>}
      <div style={row}>
        <button onClick={onCancel} style={{ ...secondary, flex: 1 }}>Never mind</button>
        <button onClick={submit} disabled={busy} style={{ ...primary, flex: 2 }}>{busy ? "Posting…" : "Post my call-out"}</button>
      </div>
    </div>
  );
}
