import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { GeneratedProduct } from "./product-types";

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.4, 0.2, 0.8];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

function wrapText(text: string, maxWidth: number, fontSize: number, avgCharWidth: number): string[] {
  const charsPerLine = Math.floor(maxWidth / (fontSize * avgCharWidth));
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= charsPerLine) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateEtsyDeliverable(product: GeneratedProduct): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Page 1: Cover / Template Link
  const page1 = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page1.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const brandColor = product.colorPalette?.[0]
    ? hexToRgb(product.colorPalette[0])
    : ([0.4, 0.2, 0.8] as [number, number, number]);
  const accentColor = product.colorPalette?.[1]
    ? hexToRgb(product.colorPalette[1])
    : ([0.9, 0.6, 0.2] as [number, number, number]);

  // Background gradient-like header bar
  page1.drawRectangle({
    x: 0,
    y: height - 180,
    width,
    height: 180,
    color: rgb(...brandColor),
  });

  // Small accent stripe
  page1.drawRectangle({
    x: 0,
    y: height - 185,
    width,
    height: 5,
    color: rgb(...accentColor),
  });

  // Title on header
  const titleLines = wrapText(product.title, width - 80, 28, 0.55);
  let ty = height - 70;
  for (const line of titleLines.slice(0, 2)) {
    page1.drawText(line, {
      x: 40,
      y: ty,
      size: 26,
      font: bold,
      color: rgb(1, 1, 1),
    });
    ty -= 36;
  }

  // Category badge
  page1.drawText(`✦ ${product.category.replace("_", " ").toUpperCase()} TEMPLATE`, {
    x: 40,
    y: height - 155,
    size: 11,
    font: regular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // --- Main content area ---
  let y = height - 220;

  // Section: How to access
  page1.drawText("HOW TO ACCESS YOUR TEMPLATE", {
    x: 40,
    y,
    size: 12,
    font: bold,
    color: rgb(...brandColor),
  });
  y -= 6;
  page1.drawRectangle({ x: 40, y, width: 515, height: 2, color: rgb(...brandColor) });
  y -= 30;

  const steps = [
    "1.  Click the Canva template link below (or copy & paste it into your browser)",
    "2.  Sign in to your free Canva account (or create one — it's free!)",
    '3.  Click "Use Template" to get your own editable copy',
    "4.  Customize colors, fonts, text, and images to match your brand",
    "5.  Download your finished design as PDF, PNG, or JPG",
  ];

  for (const step of steps) {
    page1.drawText(step, {
      x: 40,
      y,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 22;
  }

  y -= 20;

  // --- Canva Link Box ---
  const canvaLink = product.canvaTemplateLink || "https://canva.com/your-template-link-here";

  // Link box background
  page1.drawRectangle({
    x: 40,
    y: y - 60,
    width: 515,
    height: 80,
    color: rgb(0.96, 0.96, 1),
    borderColor: rgb(...brandColor),
    borderWidth: 2,
  });

  page1.drawText("YOUR CANVA TEMPLATE LINK:", {
    x: 55,
    y: y - 20,
    size: 10,
    font: bold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page1.drawText(canvaLink, {
    x: 55,
    y: y - 42,
    size: 10,
    font: bold,
    color: rgb(...brandColor),
  });

  page1.drawText("↑  Click or copy this link into your browser", {
    x: 55,
    y: y - 60,
    size: 9,
    font: italic,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= 100;

  // --- What's included ---
  page1.drawText("WHAT'S INCLUDED", {
    x: 40,
    y,
    size: 12,
    font: bold,
    color: rgb(...brandColor),
  });
  y -= 6;
  page1.drawRectangle({ x: 40, y, width: 515, height: 2, color: rgb(...brandColor) });
  y -= 28;

  const included = [
    "✓  Fully editable Canva template — customize everything",
    "✓  Professional design ready to use as-is",
    "✓  Commercial use license included",
    "✓  No Canva Pro required (free Canva account works)",
    "✓  Instant access via the link above",
  ];

  for (const item of included) {
    page1.drawText(item, {
      x: 40,
      y,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 22;
  }

  y -= 25;

  // Style notes
  if (product.styleNotes) {
    page1.drawText("DESIGN NOTES", {
      x: 40,
      y,
      size: 12,
      font: bold,
      color: rgb(...brandColor),
    });
    y -= 6;
    page1.drawRectangle({ x: 40, y, width: 515, height: 2, color: rgb(...brandColor) });
    y -= 24;

    const styleLines = wrapText(product.styleNotes, 515, 11, 0.52);
    for (const line of styleLines) {
      page1.drawText(line, {
        x: 40,
        y,
        size: 11,
        font: italic,
        color: rgb(0.35, 0.35, 0.35),
      });
      y -= 18;
    }
  }

  // Footer
  page1.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 50,
    color: rgb(0.12, 0.12, 0.12),
  });
  page1.drawText("Thank you for your purchase! Questions? Contact me through Etsy.", {
    x: 40,
    y: 18,
    size: 10,
    font: regular,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Page 2: Etsy Description + Tags
  const page2 = pdfDoc.addPage(PageSizes.A4);

  // Header bar
  page2.drawRectangle({
    x: 0,
    y: page2.getHeight() - 70,
    width: page2.getWidth(),
    height: 70,
    color: rgb(...brandColor),
  });
  page2.drawRectangle({
    x: 0,
    y: page2.getHeight() - 75,
    width: page2.getWidth(),
    height: 5,
    color: rgb(...accentColor),
  });

  page2.drawText("PRODUCT DETAILS & LISTING COPY", {
    x: 40,
    y: page2.getHeight() - 46,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y2 = page2.getHeight() - 110;

  // Etsy Description
  page2.drawText("ETSY DESCRIPTION (copy & paste ready)", {
    x: 40,
    y: y2,
    size: 12,
    font: bold,
    color: rgb(...brandColor),
  });
  y2 -= 6;
  page2.drawRectangle({ x: 40, y: y2, width: 515, height: 2, color: rgb(...brandColor) });
  y2 -= 20;

  const descLines = wrapText(product.etsyDescription || product.description, 515, 10, 0.52);
  for (const line of descLines) {
    if (y2 < 80) break;
    page2.drawText(line, {
      x: 40,
      y: y2,
      size: 10,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y2 -= 16;
  }

  y2 -= 20;

  // Tags
  if (y2 > 150) {
    page2.drawText("SUGGESTED ETSY TAGS", {
      x: 40,
      y: y2,
      size: 12,
      font: bold,
      color: rgb(...brandColor),
    });
    y2 -= 6;
    page2.drawRectangle({ x: 40, y: y2, width: 515, height: 2, color: rgb(...brandColor) });
    y2 -= 24;

    const tags = product.etsyTags || [];
    let tagX = 40;
    for (const tag of tags.slice(0, 13)) {
      const tagWidth = tag.length * 7 + 20;
      if (tagX + tagWidth > 555) {
        tagX = 40;
        y2 -= 30;
      }
      page2.drawRectangle({
        x: tagX,
        y: y2 - 8,
        width: tagWidth,
        height: 22,
        color: rgb(0.95, 0.93, 1),
        borderColor: rgb(...brandColor),
        borderWidth: 1,
      });
      page2.drawText(tag, {
        x: tagX + 10,
        y: y2 + 1,
        size: 9,
        font: regular,
        color: rgb(...brandColor),
      });
      tagX += tagWidth + 8;
    }
  }

  // Footer
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: page2.getWidth(),
    height: 50,
    color: rgb(0.12, 0.12, 0.12),
  });
  page2.drawText("Generated by Canva Product Generator  •  Ready to sell on Etsy", {
    x: 40,
    y: 18,
    size: 10,
    font: regular,
    color: rgb(0.8, 0.8, 0.8),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
