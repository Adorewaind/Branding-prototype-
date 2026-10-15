import type { Metadata, Viewport } from "next";
import StaffView from "./StaffView";

export const metadata: Metadata = {
  title: "My Shifts",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0f0c" };

export default async function StaffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <StaffView token={token} />;
}
