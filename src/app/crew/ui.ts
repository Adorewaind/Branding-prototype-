import type { CSSProperties } from "react";

export const C = {
  bg: "#0b0f0c", card: "#141a16", field: "#0f1511", line: "#243028", text: "#eef5ef", dim: "#8fa396",
  green: "#3ddc84", ink: "#06210f", amber: "#f5b942", red: "#ff6b6b",
};

export const page: CSSProperties = { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" };
export const wrap: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "16px 16px 64px" };
export const card: CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, marginBottom: 14 };
export const label: CSSProperties = { display: "block", fontWeight: 700, fontSize: 15, marginBottom: 10 };
export const small: CSSProperties = { color: C.dim, fontSize: 13 };
export const input: CSSProperties = { width: "100%", background: C.field, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 16 };
export const chip: CSSProperties = { padding: "8px 12px", borderRadius: 999, border: `1px solid ${C.line}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" };
export const primary: CSSProperties = { padding: "14px 16px", borderRadius: 12, border: "none", background: C.green, color: C.ink, fontWeight: 800, fontSize: 16, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "inline-block" };
export const secondary: CSSProperties = { padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: "transparent", color: C.text, fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "inline-block" };
export const row: CSSProperties = { display: "flex", gap: 10, alignItems: "center" };
export const toastStyle: CSSProperties = { position: "fixed", left: 16, right: 16, bottom: 20, margin: "0 auto", maxWidth: 528, background: C.green, color: C.ink, padding: "12px 16px", borderRadius: 12, fontWeight: 700, textAlign: "center", zIndex: 50 };

export function chipOn(on: boolean): CSSProperties {
  return { ...chip, background: on ? C.green : "transparent", color: on ? C.ink : C.text, borderColor: on ? C.green : C.line };
}
