import { NextRequest, NextResponse } from "next/server";
import { generateEtsyDeliverable } from "@/lib/pdf-generator";
import { GeneratedProduct } from "@/lib/product-types";

export async function POST(req: NextRequest) {
  try {
    const { product } = await req.json();

    if (!product) {
      return NextResponse.json({ error: "Product data is required" }, { status: 400 });
    }

    const pdfBytes = await generateEtsyDeliverable(product as GeneratedProduct);

    // Return as base64 JSON — avoids binary transfer issues in serverless environments
    const base64 = Buffer.from(pdfBytes).toString("base64");
    return NextResponse.json({ pdf: base64, filename: `${product.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ?? "product"}-etsy.pdf` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PDF export error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
