import { NextRequest, NextResponse } from "next/server";
import { analyzeAndGenerateProduct } from "@/lib/claude";
import { ProductCategory } from "@/lib/product-types";

export async function POST(req: NextRequest) {
  try {
    const { prompt, category } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const product = await analyzeAndGenerateProduct(
      prompt,
      category as ProductCategory | undefined
    );

    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
