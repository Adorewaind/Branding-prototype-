import type { Metadata, Viewport } from "next";
import SpotChecker from "./SpotChecker";

export const metadata: Metadata = {
  title: "Protein Line Spot-Check",
  description: "Quick inventory spot-checks for the restaurant protein line: hand count, Bluetooth scale, or AI photo estimate.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f0c",
};

export default function SpotCheckPage() {
  return <SpotChecker />;
}
