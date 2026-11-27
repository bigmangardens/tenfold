import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import { Nav } from "@/components/Nav";
import { siteUrl } from "@/lib/format";
import "./globals.css";

const sans = Pixelify_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const arcade = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-arcade", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Tenfold · The daily rare-answer hunt", template: "%s · Tenfold" },
  description: "Ten open prompts a day. Type any valid answer: the fewer players who think of it, the more it scores.",
  openGraph: { siteName: "Tenfold", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0B0820", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${arcade.variable}`}>
      <body className="font-sans antialiased">
        <div className="scanlines" aria-hidden />
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-16 md:pt-10">{children}</main>
      </body>
    </html>
  );
}
