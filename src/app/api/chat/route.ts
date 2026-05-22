import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { businessId, messages } = await req.json();

    if (!businessId || !messages?.length) {
      return NextResponse.json({ error: "Missing businessId or messages" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: bizSettings } = await supabase
      .from("business_settings")
      .select("*")
      .eq("profile_id", businessId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, business_type")
      .eq("id", businessId)
      .single();

    const businessName = profile?.business_name || "this business";
    const businessType = profile?.business_type || "service business";
    const aiName = bizSettings?.ai_name || "AI Receptionist";
    const greeting = bizSettings?.greeting || "";
    const depositPolicy = bizSettings?.deposit_policy || "";
    const cancellationPolicy = bizSettings?.cancellation_policy || "";
    const bookingLink = bizSettings?.booking_link || "";
    const services: Array<{ name: string; price: string; description: string }> = bizSettings?.services || [];
    const faqs: Array<{ question: string; answer: string }> = bizSettings?.faqs || [];

    let systemPrompt = `You are ${aiName}, the AI receptionist for ${businessName} (${businessType}). You are warm, helpful, and professional. Keep responses concise — 2-4 sentences unless detailed info is requested. Always offer to help further or assist with booking at the end of your response.`;

    if (services.length > 0) {
      systemPrompt += "\n\nSERVICES & PRICING:\n" + services.map(s => `- ${s.name}: ${s.price}${s.description ? ` — ${s.description}` : ""}`).join("\n");
    }

    if (depositPolicy) systemPrompt += `\n\nDEPOSIT POLICY:\n${depositPolicy}`;
    if (cancellationPolicy) systemPrompt += `\n\nCANCELLATION POLICY:\n${cancellationPolicy}`;
    if (bookingLink) systemPrompt += `\n\nBOOKING:\nClients can book at: ${bookingLink}`;

    if (faqs.length > 0) {
      systemPrompt += "\n\nFREQUENTLY ASKED QUESTIONS:\n" + faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
