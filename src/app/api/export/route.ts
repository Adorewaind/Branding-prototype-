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

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${product.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ?? "product"}-etsy-deliverable.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
