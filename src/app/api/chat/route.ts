import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SYSTEM = `You are a friendly AI receptionist for a service business. Be warm, concise, and helpful. Answer questions about services, pricing, and booking. If you don't know specific details, offer to have the owner follow up.`;

export async function POST(req: NextRequest) {
  const { messages, businessId } = await req.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let systemPrompt = DEFAULT_SYSTEM;

  if (businessId) {
    const { data: settings } = await supabase
      .from("business_settings")
      .select("*, profiles(business_name, business_type)")
      .eq("profile_id", businessId)
      .single();

    if (settings) {
      const profile = settings.profiles as { business_name: string; business_type: string } | null;
      systemPrompt = `You are ${settings.ai_name || "an AI receptionist"} for ${profile?.business_name || "this business"}, a ${profile?.business_type || "service business"}.

${settings.greeting ? `Greeting: ${settings.greeting}` : ""}
${settings.services?.length ? `Services: ${JSON.stringify(settings.services)}` : ""}
${settings.deposit_policy ? `Deposit Policy: ${settings.deposit_policy}` : ""}
${settings.cancellation_policy ? `Cancellation Policy: ${settings.cancellation_policy}` : ""}
${settings.booking_link ? `Booking Link: ${settings.booking_link}` : ""}
${settings.faqs?.length ? `FAQs: ${JSON.stringify(settings.faqs)}` : ""}

Be warm, professional, and concise (2-4 sentences). Always offer to help with booking or answer more questions.`;
    }
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply: text });
}
