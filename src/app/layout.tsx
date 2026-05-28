import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cultural & Trend Intelligence Calendar",
  description:
    "Track, visualize, and surface cross-industry cultural intersections to identify strategic collaboration windows for high-end consumer brands.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
