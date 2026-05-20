import { NextRequest, NextResponse } from "next/server";

// Canva Connect API integration
// Docs: https://www.canva.com/developers/docs/connect/
// Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET in .env.local
// Then complete OAuth flow to get an access token

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

async function canvaRequest(path: string, options: RequestInit = {}) {
  const token = process.env.CANVA_ACCESS_TOKEN;
  if (!token) throw new Error("CANVA_ACCESS_TOKEN not configured");

  const res = await fetch(`${CANVA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Canva API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  const { action, payload } = await req.json();

  try {
    if (action === "create_design") {
      // Create a new design from a title/type
      const { title, design_type } = payload;

      const result = await canvaRequest("/designs", {
        method: "POST",
        body: JSON.stringify({
          title,
          design_type: { type: "preset", name: design_type },
        }),
      });

      return NextResponse.json({
        designId: result.design?.id,
        editUrl: result.design?.urls?.edit_url,
        viewUrl: result.design?.urls?.view_url,
      });
    }

    if (action === "get_share_link") {
      const { designId } = payload;

      const result = await canvaRequest(`/designs/${designId}/links`, {
        method: "POST",
        body: JSON.stringify({ action: "USE_TEMPLATE" }),
      });

      return NextResponse.json({
        templateLink: result.link?.url,
      });
    }

    if (action === "export_design") {
      const { designId, format } = payload;

      const exportResult = await canvaRequest("/exports", {
        method: "POST",
        body: JSON.stringify({
          design_id: designId,
          format: format ?? "pdf_standard",
        }),
      });

      const jobId = exportResult.job?.id;
      if (!jobId) throw new Error("Export job not created");

      // Poll for completion (max 30s)
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await canvaRequest(`/exports/${jobId}`);
        if (status.job?.status === "success") {
          return NextResponse.json({ urls: status.job.urls });
        }
        if (status.job?.status === "failed") {
          throw new Error("Export failed");
        }
      }
      throw new Error("Export timed out");
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
