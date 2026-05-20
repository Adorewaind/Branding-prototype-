"use client";

import { useState } from "react";
import { PRODUCT_TYPES, ProductCategory } from "@/lib/product-types";

interface Props {
  onGenerate: (prompt: string, category?: string) => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "Boho floral weekly planner with habit tracker",
  "Minimalist motivational wall art quotes set",
  "Aesthetic Instagram story templates for small businesses",
  "Vintage botanical clip art bundle PNG",
  "Budget planner printable with expense tracker",
  "Modern business media kit template",
];

export default function ProductGeneratorForm({ onGenerate, isGenerating }: Props) {
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), selectedCategory || undefined);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prompt input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe your product
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Boho floral weekly planner with a habit tracker and monthly goals page..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none text-sm transition-all"
              disabled={isGenerating}
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-300">
              {prompt.length} chars
            </span>
          </div>
        </div>

        {/* Category selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product type{" "}
            <span className="font-normal text-gray-400">(optional — AI will detect automatically)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRODUCT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === type.id ? "" : type.id)
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  selectedCategory === type.id
                    ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50"
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
                {type.bestSelling && (
                  <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 rounded px-1 font-medium">
                    HOT
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Quick examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-full transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            !prompt.trim() || isGenerating
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating your product...
            </span>
          ) : (
            "✨ Generate Product"
          )}
        </button>
      </form>
    </div>
  );
}
