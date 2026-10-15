export const ROLES = ["Grill cook", "Line cook", "Prep cook", "Cashier", "Server", "Bartender", "Dish", "Shift lead"];

export interface CrewLocation { id: string; name: string; }

export interface CrewStaff {
  id: string;
  location_id: string;
  name: string;
  phone: string | null;
  roles: string[];
  token: string;
  active: boolean;
}

export interface CrewShift {
  id: string;
  location_id: string;
  role: string;
  starts_at: string;
  ends_at: string;
  called_out_staff_id: string | null;
  covered_by_staff_id: string | null;
  status: "open" | "covered" | "cancelled";
  bonus: number;
  note: string | null;
  source: "manager" | "staff";
  covered_at: string | null;
  created_at: string;
}

export function formatShift(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = s.toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day} ${t(s)}–${t(e)}`;
}

export function staffLink(origin: string, token: string): string {
  return `${origin}/crew/${token}`;
}

export function openShiftMessage(
  locationName: string,
  shift: Pick<CrewShift, "role" | "starts_at" | "ends_at" | "bonus">,
  link: string,
): string {
  const bonus = Number(shift.bonus) > 0 ? ` +$${Number(shift.bonus)} bonus.` : "";
  return `Shift open at ${locationName}: ${shift.role}, ${formatShift(shift.starts_at, shift.ends_at)}.${bonus} First to tap gets it: ${link}`;
}

// Staff the shift should go to: active, has the role (or no roles set), and not the person who called out.
export function eligibleStaff(staff: CrewStaff[], shift: Pick<CrewShift, "role" | "called_out_staff_id">): CrewStaff[] {
  return staff.filter(s =>
    s.active &&
    s.id !== shift.called_out_staff_id &&
    (s.roles.length === 0 || s.roles.includes(shift.role)),
  );
}

// Combine a date input (YYYY-MM-DD) and time input (HH:MM) in the browser's timezone.
// An end time earlier than the start time means the shift runs past midnight.
export function toShiftRange(date: string, start: string, end: string): { starts_at: string; ends_at: string } | null {
  if (!date || !start || !end) return null;
  const s = new Date(`${date}T${start}`);
  const e = new Date(`${date}T${end}`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  if (e <= s) e.setDate(e.getDate() + 1);
  return { starts_at: s.toISOString(), ends_at: e.toISOString() };
}

export function smsHref(phone: string, body: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(body)}`;
}
