import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automation Copilot",
  description: "Convert natural language into n8n workflow JSON",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
