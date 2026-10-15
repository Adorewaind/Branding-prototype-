import type { Metadata, Viewport } from "next";
import CrewManager from "./CrewManager";

export const metadata: Metadata = { title: "Crew Coverage" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0f0c" };

export default function CrewPage() {
  return <CrewManager />;
}
