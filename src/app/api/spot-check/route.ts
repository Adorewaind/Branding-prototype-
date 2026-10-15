import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ~4MB of base64 is far more than a 1024px JPEG needs; reject anything bigger.
const MAX_IMAGE_CHARS = 4_000_000;

export async function POST(req: NextRequest) {
  try {
    const { image, item, unit } = await req.json();

    if (typeof image !== "string" || !image.startsWith("data:image/jpeg;base64,")) {
      return NextResponse.json({ error: "Missing or invalid image" }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const itemName = typeof item === "string" && item.trim() ? item.trim().slice(0, 60) : "protein";
    const unitName = typeof unit === "string" && unit.trim() ? unit.trim().slice(0, 20) : "pieces";

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 600,
      system:
        "You help restaurant line cooks do quick inventory spot-checks from a single phone photo. " +
        "Be honest about uncertainty: if items overlap, are stacked, or are partly hidden, say so and lower your confidence. " +
        "Never invent precision you don't have.",
      tools: [
        {
          name: "report_count",
          description: "Report the estimated inventory count for the photo.",
          input_schema: {
            type: "object",
            properties: {
              count: { type: "integer", description: `Best estimate of how many ${unitName} of ${itemName} are visible.` },
              low: { type: "integer", description: "Low end of a reasonable range." },
              high: { type: "integer", description: "High end of a reasonable range." },
              fill_percent: { type: "integer", description: "If this is a pan/container, roughly how full it is (0-100). Use -1 if not applicable." },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              notes: { type: "string", description: "One short sentence for the cook, e.g. what made counting hard or a tip for a better photo." },
            },
            required: ["count", "low", "high", "fill_percent", "confidence", "notes"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "report_count" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image.slice("data:image/jpeg;base64,".length) },
            },
            { type: "text", text: `Count the ${itemName} in this photo, in ${unitName}.` },
          ],
        },
      ],
    });

    const toolUse = response.content.find(b => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "AI did not return a count" }, { status: 502 });
    }
    return NextResponse.json(toolUse.input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
