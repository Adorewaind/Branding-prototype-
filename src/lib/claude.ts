import Anthropic from "@anthropic-ai/sdk";
import { ProductCategory, GeneratedProduct, PRODUCT_TYPES } from "./product-types";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analyzeAndGenerateProduct(
  prompt: string,
  forcedCategory?: ProductCategory
): Promise<GeneratedProduct> {
  const productTypesDesc = PRODUCT_TYPES.map(
    (p) => `- ${p.id}: ${p.label} — ${p.description} (e.g. ${p.examples.join(", ")})`
  ).join("\n");

  const systemPrompt = `You are an expert Etsy digital product creator specializing in Canva templates.
You create best-selling digital products that are ready to list on Etsy.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Create a complete Etsy digital product based on this prompt: "${prompt}"
${forcedCategory ? `\nForce the product category to: ${forcedCategory}` : ""}

Available product categories:
${productTypesDesc}

Respond with this exact JSON structure:
{
  "title": "Compelling product title (5-10 words)",
  "description": "Short internal description of what this product is",
  "etsyDescription": "Full Etsy listing description (200-300 words). Include what's included, how to use it, and benefits. Mention it's editable in Canva.",
  "etsyTags": ["tag1", "tag2", ... up to 13 relevant Etsy tags],
  "category": "one of the category ids above",
  "canvaDesignType": "the Canva design type slug (poster|instagram_post|document|doc|flyer|resume|presentation|infographic|facebook_post|pinterest_pin|youtube_thumbnail|business_card)",
  "suggestedPrompt": "A detailed prompt to use when generating this in Canva (include style, colors, mood, specific elements)",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "styleNotes": "2-3 sentences on the visual style, typography, and layout approach"
}`;

  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      { role: "user", content: userPrompt },
    ],
    system: systemPrompt,
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // Extract the first JSON object in case there's surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  try {
    const data = JSON.parse(jsonStr);
    return {
      id: crypto.randomUUID(),
      status: "generating",
      candidateId: undefined,
      thumbnailUrl: undefined,
      canvaTemplateLink: undefined,
      ...data,
    } as GeneratedProduct;
  } catch {
    throw new Error("Failed to parse AI response: " + raw.slice(0, 200));
  }
}
