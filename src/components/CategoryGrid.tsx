"use client";

import { PRODUCT_TYPES } from "@/lib/product-types";

interface Props {
  onSelect: (examplePrompt: string) => void;
}

const CATEGORY_EXAMPLES: Record<string, string[]> = {
  wall_art: [
    "Minimalist botanical prints set — 3 designs",
    "Motivational quote wall art for home office",
    "Boho rainbow nursery art printable",
  ],
  clip_art: [
    "Watercolor floral clip art bundle PNG",
    "Christmas holiday sticker pack",
    "Cute animal character clipart set",
  ],
  planner: [
    "Aesthetic daily planner with gratitude section",
    "Weekly budget planner and expense tracker",
    "Habit tracker and monthly goal-setting journal",
  ],
  social_template: [
    "Instagram post templates for coaches and consultants",
    "Pinterest pin templates for food bloggers",
    "YouTube thumbnail templates for lifestyle channel",
  ],
  business_doc: [
    "Professional media kit template for influencers",
    "Canva invoice template for freelancers",
    "Brand style guide template for small businesses",
  ],
  printable: [
    "Grocery shopping list printable with meal planner",
    "Kids chore chart printable",
    "Party planning checklist and invitations bundle",
  ],
};

export default function CategoryGrid({ onSelect }: Props) {
  return (
    <div className="mt-12">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Start with a category</h3>
      <p className="text-sm text-gray-500 mb-6">
        Click any example to instantly generate a product, or type your own prompt above.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRODUCT_TYPES.map((type) => (
          <div
            key={type.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{type.icon}</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{type.label}</h4>
                <p className="text-xs text-gray-400">{type.description}</p>
              </div>
              {type.bestSelling && (
                <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 rounded px-2 py-0.5 font-bold shrink-0">
                  BEST SELLER
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {(CATEGORY_EXAMPLES[type.id] ?? []).map((example) => (
                <button
                  key={example}
                  onClick={() => onSelect(example)}
                  className="w-full text-left text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="text-purple-400">→</span>
                  {example}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🤖</div>
            <div className="font-semibold text-gray-800 text-sm">AI-Powered</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Claude AI generates product titles, descriptions & Etsy copy
            </div>
          </div>
          <div>
            <div className="text-2xl mb-1">🎨</div>
            <div className="font-semibold text-gray-800 text-sm">Canva Ready</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Embeds your Canva template link so buyers can edit instantly
            </div>
          </div>
          <div>
            <div className="text-2xl mb-1">📦</div>
            <div className="font-semibold text-gray-800 text-sm">Etsy Packaged</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Download a professional PDF deliverable ready to upload to Etsy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
