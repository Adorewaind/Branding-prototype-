"use client";

import { useState } from "react";
import { GeneratedProduct, PRODUCT_TYPES } from "@/lib/product-types";

interface Props {
  product: GeneratedProduct;
  onUpdate: (product: GeneratedProduct) => void;
  onRemove: (id: string) => void;
}

export default function ProductCard({ product, onUpdate, onRemove }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [isCanvaLoading, setIsCanvaLoading] = useState(false);
  const [canvaLink, setCanvaLink] = useState(product.canvaTemplateLink ?? "");
  const [showTagsCopied, setShowTagsCopied] = useState(false);
  const [showDescCopied, setShowDescCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "listing" | "canva">("overview");

  const productType = PRODUCT_TYPES.find((p) => p.id === product.category);
  const brandColor = product.colorPalette?.[0] ?? "#7c3aed";

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const productWithLink = { ...product, canvaTemplateLink: canvaLink || product.canvaTemplateLink };
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productWithLink }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-etsy.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateCanvaDesign = async () => {
    setIsCanvaLoading(true);
    try {
      const res = await fetch("/api/canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_design",
          payload: { title: product.title, design_type: product.canvaDesignType },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Canva API failed");

      if (data.editUrl) {
        window.open(data.editUrl, "_blank");
      }

      // Try to get template link
      if (data.designId) {
        const linkRes = await fetch("/api/canva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_share_link",
            payload: { designId: data.designId },
          }),
        });
        const linkData = await linkRes.json();
        if (linkData.templateLink) {
          setCanvaLink(linkData.templateLink);
          onUpdate({ ...product, canvaTemplateLink: linkData.templateLink });
        }
      }
    } catch (err) {
      alert(
        "Canva API error: " +
          (err instanceof Error ? err.message : "Unknown") +
          "\n\nMake sure CANVA_ACCESS_TOKEN is set in your .env.local file."
      );
    } finally {
      setIsCanvaLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "tags" | "desc") => {
    navigator.clipboard.writeText(text);
    if (type === "tags") {
      setShowTagsCopied(true);
      setTimeout(() => setShowTagsCopied(false), 2000);
    } else {
      setShowDescCopied(true);
      setTimeout(() => setShowDescCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div
        className="p-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, ${product.colorPalette?.[1] ?? "#ec4899"} 100%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{productType?.icon ?? "🎨"}</span>
              <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                {productType?.label ?? product.category}
              </span>
            </div>
            <h3 className="font-bold text-lg leading-tight">{product.title}</h3>
            <p className="text-sm opacity-80 mt-1 line-clamp-2">{product.description}</p>
          </div>
          <button
            onClick={() => onRemove(product.id)}
            className="text-white/60 hover:text-white/90 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Color palette */}
        <div className="flex gap-1.5 mt-3">
          {product.colorPalette?.map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border-2 border-white/30"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["overview", "listing", "canva"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? "text-purple-600 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "listing" ? "Etsy Copy" : "Canva"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Style Notes
              </p>
              <p className="text-sm text-gray-600">{product.styleNotes}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Canva Design Type
              </p>
              <span className="inline-flex items-center gap-1 text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">
                🎨 {product.canvaDesignType}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Suggested Canva Prompt
              </p>
              <p className="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-3">
                &ldquo;{product.suggestedPrompt}&rdquo;
              </p>
            </div>
          </div>
        )}

        {activeTab === "listing" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Etsy Description
                </p>
                <button
                  onClick={() => copyToClipboard(product.etsyDescription, "desc")}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showDescCopied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 max-h-36 overflow-y-auto">
                {product.etsyDescription}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Etsy Tags ({product.etsyTags?.length ?? 0}/13)
                </p>
                <button
                  onClick={() => copyToClipboard(product.etsyTags?.join(", ") ?? "", "tags")}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showTagsCopied ? "✓ Copied!" : "Copy all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.etsyTags?.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "canva" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Canva Template Link
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Paste your Canva &quot;Use Template&quot; link here — this will be embedded in the Etsy PDF deliverable.
              </p>
              <input
                type="url"
                value={canvaLink}
                onChange={(e) => setCanvaLink(e.target.value)}
                placeholder="https://www.canva.com/design/..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            <button
              onClick={handleCreateCanvaDesign}
              disabled={isCanvaLoading}
              className="w-full py-2.5 rounded-xl border-2 border-purple-500 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-all disabled:opacity-50"
            >
              {isCanvaLoading ? "Creating in Canva..." : "🎨 Create in Canva (API)"}
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <strong>Without Canva API?</strong> Create your design manually in Canva using the
              prompt above, then share it as a template and paste the link here.
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5">
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            isExporting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isExporting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating PDF...
            </span>
          ) : (
            "⬇ Download Etsy Deliverable PDF"
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          Includes Canva link, buyer instructions & listing copy
        </p>
      </div>
    </div>
  );
}
