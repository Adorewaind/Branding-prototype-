import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_settings")
    .select("ai_name, greeting, accent_color")
    .eq("profile_id", id)
    .single();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ai_name: data.ai_name || "AI Receptionist",
    greeting: data.greeting || "Hi! How can I help you today? 💕",
    accent_color: data.accent_color || "#6b8cff",
  });
}
