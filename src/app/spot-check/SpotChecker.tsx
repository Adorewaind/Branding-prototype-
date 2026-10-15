"use client";

import { useEffect, useRef, useState } from "react";

type Method = "hand" | "scale" | "ai";

interface Item { name: string; unit: string; par: number; }

interface LogEntry {
  id: string;
  at: string;
  employee: string;
  item: string;
  method: Method;
  value: number;
  unit: string;
  par: number;
  note?: string;
}

interface AiResult {
  count: number;
  low: number;
  high: number;
  fill_percent: number;
  confidence: "high" | "medium" | "low";
  notes: string;
}

const DEFAULT_ITEMS: Item[] = [
  { name: "Chicken breast", unit: "pcs", par: 40 },
  { name: "Steak (8oz)", unit: "pcs", par: 24 },
  { name: "Salmon fillet", unit: "pcs", par: 20 },
  { name: "Shrimp", unit: "lb", par: 10 },
  { name: "Ground beef", unit: "lb", par: 15 },
  { name: "Pulled pork", unit: "lb", par: 12 },
];

const METHOD_LABEL: Record<Method, string> = { hand: "Hand count", scale: "Scale", ai: "AI guess" };
const LOG_KEY = "spotcheck.log.v1";
const ITEMS_KEY = "spotcheck.items.v1";
const EMPLOYEE_KEY = "spotcheck.employee.v1";

const C = {
  bg: "#0b0f0c", card: "#141a16", line: "#243028", text: "#eef5ef", dim: "#8fa396",
  green: "#3ddc84", greenDim: "#1f6b43", amber: "#f5b942", red: "#ff6b6b",
};

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// Bluetooth SIG Weight Scale Service / Weight Measurement characteristic.
const WEIGHT_SERVICE = 0x181d;
const WEIGHT_MEASUREMENT = 0x2a9d;

function parseWeight(view: DataView): { value: number; unit: "kg" | "lb" } {
  const imperial = (view.getUint8(0) & 0x01) === 1;
  const raw = view.getUint16(1, true);
  return imperial ? { value: raw * 0.01, unit: "lb" } : { value: raw * 0.005, unit: "kg" };
}

export default function SpotChecker() {
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [employee, setEmployee] = useState("");
  const [itemIdx, setItemIdx] = useState(0);
  const [method, setMethod] = useState<Method | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    // Hydrate from localStorage after mount so server and client markup match.
    /* eslint-disable react-hooks/set-state-in-effect */
    setItems(load(ITEMS_KEY, DEFAULT_ITEMS));
    setLog(load(LOG_KEY, []));
    setEmployee(load(EMPLOYEE_KEY, ""));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const item = items[itemIdx] ?? items[0];

  function record(value: number, m: Method, unit = item.unit, note?: string) {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      employee: employee.trim() || "—",
      item: item.name,
      method: m,
      value: Math.round(value * 100) / 100,
      unit,
      par: item.par,
      note,
    };
    const next = [entry, ...log].slice(0, 500);
    setLog(next);
    save(LOG_KEY, next);
    setMethod(null);
    setToast(`Saved: ${entry.value} ${unit} of ${item.name}`);
    setTimeout(() => setToast(""), 2500);
  }

  function updatePar(par: number) {
    const next = items.map((it, i) => (i === itemIdx ? { ...it, par } : it));
    setItems(next);
    save(ITEMS_KEY, next);
  }

  function exportCsv() {
    const header = "time,employee,item,method,value,unit,par,variance,note";
    const rows = log.map(e =>
      [e.at, e.employee, e.item, METHOD_LABEL[e.method], e.value, e.unit, e.par, Math.round((e.value - e.par) * 100) / 100, e.note ?? ""]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spot-checks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 48px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700, letterSpacing: 1 }}>SPOT-CHECK</div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Protein Line</h1>
          </div>
          <input
            value={employee}
            onChange={e => { setEmployee(e.target.value); save(EMPLOYEE_KEY, e.target.value); }}
            placeholder="Your name"
            style={{ ...inputStyle, width: 130 }}
          />
        </header>

        {/* Item picker */}
        <section style={cardStyle}>
          <label style={labelStyle}>What are you checking?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map((it, i) => (
              <button
                key={it.name}
                onClick={() => { setItemIdx(i); setMethod(null); }}
                style={{
                  ...chipStyle,
                  background: i === itemIdx ? C.green : "transparent",
                  color: i === itemIdx ? "#06210f" : C.text,
                  borderColor: i === itemIdx ? C.green : C.line,
                }}
              >
                {it.name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: C.dim, fontSize: 14 }}>
            Par level:
            <input
              type="number"
              inputMode="decimal"
              value={item.par}
              onChange={e => updatePar(Number(e.target.value) || 0)}
              style={{ ...inputStyle, width: 80, padding: "6px 8px" }}
            />
            {item.unit}
          </div>
        </section>

        {/* The question */}
        {!method && (
          <section style={cardStyle}>
            <label style={labelStyle}>How would you like to count the {item.name.toLowerCase()}?</label>
            <div style={{ display: "grid", gap: 10 }}>
              <MethodButton icon="✋" title="Hand count" sub="Tap to tally each piece. Most accurate." onClick={() => setMethod("hand")} />
              <MethodButton icon="⚖️" title="Connect a Bluetooth scale" sub="Read the weight straight from the scale." onClick={() => setMethod("scale")} />
              <MethodButton icon="📷" title="Let AI guess" sub="Snap a photo for a quick estimate." onClick={() => setMethod("ai")} />
            </div>
          </section>
        )}

        {method === "hand" && <HandCount item={item} onCancel={() => setMethod(null)} onSave={v => record(v, "hand")} />}
        {method === "scale" && <ScaleCount item={item} onCancel={() => setMethod(null)} onSave={(v, unit) => record(v, "scale", unit)} />}
        {method === "ai" && <AiCount item={item} onCancel={() => setMethod(null)} onSave={(v, note) => record(v, "ai", item.unit, note)} />}

        {/* Log */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Recent checks</label>
            {log.length > 0 && <button onClick={exportCsv} style={{ ...chipStyle, fontSize: 12 }}>Export CSV</button>}
          </div>
          {log.length === 0 ? (
            <div style={{ color: C.dim, fontSize: 14 }}>No checks yet. Your first one will show up here.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: C.dim, textAlign: "left" }}>
                    <th style={thStyle}>Time</th><th style={thStyle}>Item</th><th style={thStyle}>How</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Count</th><th style={{ ...thStyle, textAlign: "right" }}>vs par</th>
                  </tr>
                </thead>
                <tbody>
                  {log.slice(0, 25).map(e => {
                    const diff = Math.round((e.value - e.par) * 100) / 100;
                    const comparable = e.unit === items.find(i => i.name === e.item)?.unit;
                    return (
                      <tr key={e.id} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdStyle}>
                          {new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          <div style={{ color: C.dim, fontSize: 11 }}>{e.employee}</div>
                        </td>
                        <td style={tdStyle}>{e.item}</td>
                        <td style={tdStyle}>{METHOD_LABEL[e.method]}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{e.value} {e.unit}</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: !comparable ? C.dim : diff < 0 ? C.red : C.green }}>
                          {comparable ? (diff > 0 ? `+${diff}` : diff) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p style={{ color: C.dim, fontSize: 12, textAlign: "center" }}>Checks are saved on this device only.</p>
      </div>

      {toast && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 20, margin: "0 auto", maxWidth: 488, background: C.green, color: "#06210f", padding: "12px 16px", borderRadius: 12, fontWeight: 700, textAlign: "center" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function MethodButton({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${C.line}`, background: "#0f1511", color: C.text, textAlign: "left", cursor: "pointer" }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{title}</span>
        <span style={{ display: "block", color: C.dim, fontSize: 13, marginTop: 2 }}>{sub}</span>
      </span>
    </button>
  );
}

function HandCount({ item, onCancel, onSave }: { item: Item; onCancel: () => void; onSave: (v: number) => void }) {
  const [n, setN] = useState(0);
  return (
    <section style={cardStyle}>
      <label style={labelStyle}>✋ Hand count: {item.name}</label>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "12px 0" }}>
        <button onClick={() => setN(v => Math.max(0, v - 1))} style={bigRoundBtn}>−</button>
        <input
          type="number"
          inputMode="numeric"
          value={n}
          onChange={e => setN(Math.max(0, Number(e.target.value) || 0))}
          style={{ ...inputStyle, width: 110, fontSize: 40, fontWeight: 800, textAlign: "center" }}
        />
        <button onClick={() => setN(v => v + 1)} style={{ ...bigRoundBtn, background: C.green, color: "#06210f", borderColor: C.green }}>+</button>
      </div>
      <div style={{ textAlign: "center", color: C.dim, fontSize: 13, marginBottom: 12 }}>{item.unit} · par {item.par}</div>
      <Actions onCancel={onCancel} onSave={() => onSave(n)} />
    </section>
  );
}

function ScaleCount({ item, onCancel, onSave }: { item: Item; onCancel: () => void; onSave: (v: number, unit: string) => void }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "unsupported" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState<{ value: number; unit: string } | null>(null);
  const [manual, setManual] = useState("");
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);

  useEffect(() => {
    const bt = (navigator as NavigatorWithBluetooth).bluetooth;
    // Feature detection has to run on the client after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!bt) setStatus("unsupported");
    return () => { deviceRef.current?.gatt?.disconnect(); };
  }, []);

  async function connect() {
    const bt = (navigator as NavigatorWithBluetooth).bluetooth;
    if (!bt) return;
    setStatus("connecting");
    setMessage("");
    try {
      const device = await bt.requestDevice({ filters: [{ services: [WEIGHT_SERVICE] }] });
      deviceRef.current = device;
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(WEIGHT_SERVICE);
      const ch = await service.getCharacteristic(WEIGHT_MEASUREMENT);
      ch.addEventListener("characteristicvaluechanged", (ev: Event) => {
        const target = ev.target as unknown as { value: DataView };
        const w = parseWeight(target.value);
        // Convert to lb when the item is tracked in lb so variance math lines up.
        if (item.unit === "lb" && w.unit === "kg") setReading({ value: w.value * 2.20462, unit: "lb" });
        else setReading(w);
      });
      await ch.startNotifications();
      setStatus("connected");
      setMessage(`Connected to ${device.name || "scale"}. Put the pan on the scale.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not connect to the scale.");
    }
  }

  return (
    <section style={cardStyle}>
      <label style={labelStyle}>⚖️ Weigh: {item.name}</label>

      {status === "unsupported" ? (
        <div style={noticeStyle}>
          This browser can&apos;t talk to Bluetooth scales. Use <b>Chrome on Android</b> (or a desktop Chrome), or type the weight below.
        </div>
      ) : (
        <>
          <button onClick={connect} disabled={status === "connecting"} style={{ ...primaryBtn, width: "100%", marginBottom: 10 }}>
            {status === "connecting" ? "Looking for scales…" : status === "connected" ? "Reconnect scale" : "Connect Bluetooth scale"}
          </button>
          {message && <div style={{ ...noticeStyle, borderColor: status === "error" ? C.red : C.line }}>{message}</div>}
        </>
      )}

      {reading && (
        <div style={{ textAlign: "center", margin: "16px 0" }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: C.green }}>{reading.value.toFixed(2)}</div>
          <div style={{ color: C.dim }}>{reading.unit} (live)</div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", color: C.dim, fontSize: 14 }}>
        Or type the weight:
        <input type="number" inputMode="decimal" value={manual} onChange={e => setManual(e.target.value)} placeholder="0.0" style={{ ...inputStyle, width: 90 }} />
        lb
      </div>
      <div style={{ color: C.dim, fontSize: 12, marginBottom: 12 }}>
        Tip: subtract the empty pan weight. Works with scales that support the standard Bluetooth Weight Scale profile.
      </div>

      <Actions
        onCancel={onCancel}
        saveDisabled={!reading && !manual}
        onSave={() => (manual ? onSave(Number(manual), "lb") : reading && onSave(reading.value, reading.unit))}
      />
    </section>
  );
}

function AiCount({ item, onCancel, onSave }: { item: Item; onCancel: () => void; onSave: (v: number, note: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [adjusted, setAdjusted] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const md = navigator.mediaDevices;
    (md ? md.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false }) : Promise.reject(new Error("unsupported")))
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError("Camera unavailable. Allow camera access, and make sure the page is opened over https."));
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  async function scan() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    setSnapshot(dataUrl);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/spot-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, item: item.name, unit: item.unit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data);
      setAdjusted(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const confColor = result?.confidence === "high" ? C.green : result?.confidence === "medium" ? C.amber : C.red;

  return (
    <section style={cardStyle}>
      <label style={labelStyle}>📷 AI guess: {item.name}</label>

      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", aspectRatio: "3 / 4", marginBottom: 12 }}>
        {snapshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot} alt="Captured frame" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {/* Green framing grid */}
        <div style={{
          position: "absolute", inset: "8%", border: `2px solid ${C.green}`, borderRadius: 10, pointerEvents: "none",
          backgroundImage: `linear-gradient(${C.green}55 1px, transparent 1px), linear-gradient(90deg, ${C.green}55 1px, transparent 1px)`,
          backgroundSize: "25% 25%",
        }} />
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
            Counting…
          </div>
        )}
        {camError && !snapshot && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: C.dim }}>
            {camError}
          </div>
        )}
      </div>

      {!result && !loading && (
        <>
          <div style={{ color: C.dim, fontSize: 13, marginBottom: 10 }}>
            Hold the phone straight above the pan, fit it inside the green box, and spread items out if you can.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{ ...secondaryBtn, flex: 1 }}>Back</button>
            {snapshot ? (
              <button onClick={() => { setSnapshot(null); setError(""); }} style={{ ...primaryBtn, flex: 2 }}>Retake</button>
            ) : (
              <button onClick={scan} disabled={!!camError} style={{ ...primaryBtn, flex: 2 }}>Scan</button>
            )}
          </div>
          {error && <div style={{ ...noticeStyle, borderColor: C.red, marginTop: 10 }}>{error}</div>}
        </>
      )}

      {result && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 40, fontWeight: 800 }}>{result.count}</span>
              <span style={{ color: C.dim, marginLeft: 6 }}>{item.unit} (range {result.low}–{result.high})</span>
            </div>
            <span style={{ color: confColor, fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}>{result.confidence} confidence</span>
          </div>
          {result.fill_percent >= 0 && <div style={{ color: C.dim, fontSize: 13 }}>Pan looks about {result.fill_percent}% full.</div>}
          <div style={{ ...noticeStyle, margin: "10px 0" }}>{result.notes}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, color: C.dim }}>
            Looks right? Adjust if needed:
            <button onClick={() => setAdjusted(v => Math.max(0, v - 1))} style={smallBtn}>−</button>
            <b style={{ color: C.text, minWidth: 28, textAlign: "center" }}>{adjusted}</b>
            <button onClick={() => setAdjusted(v => v + 1)} style={smallBtn}>+</button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setResult(null); setSnapshot(null); }} style={{ ...secondaryBtn, flex: 1 }}>Rescan</button>
            <button
              onClick={() => onSave(adjusted, adjusted === result.count ? `AI ${result.confidence}` : `AI said ${result.count}, adjusted`)}
              style={{ ...primaryBtn, flex: 2 }}
            >
              Save {adjusted} {item.unit}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Actions({ onCancel, onSave, saveDisabled }: { onCancel: () => void; onSave: () => void; saveDisabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={onCancel} style={{ ...secondaryBtn, flex: 1 }}>Back</button>
      <button onClick={onSave} disabled={saveDisabled} style={{ ...primaryBtn, flex: 2, opacity: saveDisabled ? 0.5 : 1 }}>Save count</button>
    </div>
  );
}

// Minimal Web Bluetooth typings (not in the default TS DOM lib).
interface BluetoothCharacteristicLike extends EventTarget { startNotifications(): Promise<unknown>; }
interface BluetoothServiceLike { getCharacteristic(uuid: number): Promise<BluetoothCharacteristicLike>; }
interface BluetoothServerLike { getPrimaryService(uuid: number): Promise<BluetoothServiceLike>; }
interface BluetoothDeviceLike { name?: string; gatt?: { connect(): Promise<BluetoothServerLike>; disconnect(): void }; }
interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: { requestDevice(opts: { filters: { services: number[] }[] }): Promise<BluetoothDeviceLike> };
}

const cardStyle: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, marginBottom: 14 };
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 15, marginBottom: 12 };
const inputStyle: React.CSSProperties = { background: "#0f1511", border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, padding: "8px 10px", fontSize: 15 };
const chipStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 999, border: `1px solid ${C.line}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { padding: "14px 16px", borderRadius: 12, border: "none", background: C.green, color: "#06210f", fontWeight: 800, fontSize: 16, cursor: "pointer" };
const secondaryBtn: React.CSSProperties = { padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: "transparent", color: C.text, fontWeight: 700, fontSize: 16, cursor: "pointer" };
const bigRoundBtn: React.CSSProperties = { width: 64, height: 64, borderRadius: 32, border: `1px solid ${C.line}`, background: "#0f1511", color: C.text, fontSize: 32, fontWeight: 700, cursor: "pointer" };
const smallBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`, background: "#0f1511", color: C.text, fontSize: 18, cursor: "pointer" };
const noticeStyle: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.dim, lineHeight: 1.4 };
const thStyle: React.CSSProperties = { padding: "6px 4px", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "8px 4px", verticalAlign: "top" };
