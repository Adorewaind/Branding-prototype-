import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { eligibleStaff, openShiftMessage, staffLink, type CrewShift, type CrewStaff } from "@/lib/crew";

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  return sid && token && from ? { sid, token, from } : null;
}

// Assume US numbers when no country code is given.
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function GET() {
  return NextResponse.json({ enabled: twilioConfig() !== null });
}

// Texts every eligible staff member their personal link to an open shift.
export async function POST(req: NextRequest) {
  try {
    const twilio = twilioConfig();
    if (!twilio) return NextResponse.json({ error: "Texting is not set up yet" }, { status: 501 });

    const { shiftId } = await req.json();
    if (typeof shiftId !== "string") return NextResponse.json({ error: "Missing shiftId" }, { status: 400 });

    // Row-level security limits these reads to the signed-in manager's own data.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: shift } = await supabase.from("crew_shifts").select("*").eq("id", shiftId).single<CrewShift>();
    if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    if (shift.status !== "open") return NextResponse.json({ error: "Shift is no longer open" }, { status: 409 });

    const [{ data: location }, { data: staff }] = await Promise.all([
      supabase.from("crew_locations").select("name").eq("id", shift.location_id).single<{ name: string }>(),
      supabase.from("crew_staff").select("*").eq("location_id", shift.location_id).returns<CrewStaff[]>(),
    ]);

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const auth = "Basic " + Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64");
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const s of eligibleStaff(staff ?? [], shift)) {
      const to = s.phone ? toE164(s.phone) : null;
      if (!to) { skipped++; continue; }
      const body = openShiftMessage(location?.name ?? "work", shift, staffLink(origin, s.token));
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, From: twilio.from, Body: body }),
      });
      if (res.ok) sent++; else failed++;
    }

    return NextResponse.json({ sent, skipped, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
