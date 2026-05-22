import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex AI Receptionist",
  description: "AI-powered receptionist for your business — answers clients, handles FAQs, and books appointments 24/7.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
