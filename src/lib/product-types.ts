export type ProductCategory =
  | "wall_art"
  | "clip_art"
  | "planner"
  | "social_template"
  | "business_doc"
  | "printable";

export interface ProductType {
  id: ProductCategory;
  label: string;
  description: string;
  icon: string;
  examples: string[];
  canvaDesignType: string;
  bestSelling: boolean;
}

export interface GeneratedProduct {
  id: string;
  title: string;
  description: string;
  etsyDescription: string;
  etsyTags: string[];
  category: ProductCategory;
  canvaDesignType: string;
  suggestedPrompt: string;
  colorPalette: string[];
  styleNotes: string;
  canvaTemplateLink?: string;
  candidateId?: string;
  thumbnailUrl?: string;
  status: "generating" | "ready" | "error";
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "wall_art",
    label: "Wall Art",
    description: "Printable art for homes & offices",
    icon: "🖼️",
    examples: ["Motivational quotes", "Botanical prints", "Abstract art", "Nursery art"],
    canvaDesignType: "poster",
    bestSelling: true,
  },
  {
    id: "clip_art",
    label: "Clip Art",
    description: "PNG/SVG sets for crafters & designers",
    icon: "✂️",
    examples: ["Floral sets", "Holiday graphics", "Character stickers", "Icon packs"],
    canvaDesignType: "instagram_post",
    bestSelling: true,
  },
  {
    id: "planner",
    label: "Planners & Journals",
    description: "Daily, weekly, monthly planners",
    icon: "📅",
    examples: ["Weekly planner", "Habit tracker", "Goal journal", "Budget planner"],
    canvaDesignType: "document",
    bestSelling: true,
  },
  {
    id: "social_template",
    label: "Social Media Templates",
    description: "Editable templates for Instagram, Pinterest & more",
    icon: "📱",
    examples: ["Instagram posts", "Story templates", "Pinterest pins", "YouTube thumbnails"],
    canvaDesignType: "instagram_post",
    bestSelling: true,
  },
  {
    id: "business_doc",
    label: "Business Docs",
    description: "Professional templates for entrepreneurs",
    icon: "💼",
    examples: ["Media kit", "Invoice template", "Brand guidelines", "Proposal template"],
    canvaDesignType: "doc",
    bestSelling: false,
  },
  {
    id: "printable",
    label: "Printables & Worksheets",
    description: "Checklists, worksheets, and activity sheets",
    icon: "📋",
    examples: ["Checklists", "Coloring pages", "Workbooks", "Party printables"],
    canvaDesignType: "document",
    bestSelling: true,
  },
];
