"use client";

import { useState } from "react";
import { GeneratedProduct, PRODUCT_TYPES } from "@/lib/product-types";
import ProductGeneratorForm from "@/components/ProductGeneratorForm";
import ProductCard from "@/components/ProductCard";
import CategoryGrid from "@/components/CategoryGrid";

export default function Home() {
  const [products, setProducts] = useState<GeneratedProduct[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, category?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const product: GeneratedProduct = { ...data.product, status: "ready" };
      setProducts((prev) => [product, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProduct = (updated: GeneratedProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">
                Canva Product Generator
              </h1>
              <p className="text-xs text-gray-500">Etsy Digital Products, ready to sell</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:block">Powered by AI + Canva</span>
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              Ready
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Generate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Best-Selling
            </span>{" "}
            Digital Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your product and get a fully packaged Etsy digital download — complete with
            a Canva template link, Etsy listing copy, and tags.
          </p>
        </div>

        {/* Generator Form */}
        <ProductGeneratorForm
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Generated Products */}
        {products.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                Generated Products ({products.length})
              </h3>
              <button
                onClick={() => setProducts([])}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdate={handleUpdateProduct}
                  onRemove={handleRemoveProduct}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category Grid (empty state) */}
        {products.length === 0 && !isGenerating && (
          <CategoryGrid onSelect={(example) => handleGenerate(example)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          Canva Product Generator &mdash; Sell digital products on Etsy with ease
        </div>
      </footer>
    </div>
  );
}
