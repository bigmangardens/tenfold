import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Nav } from "@/components/Nav";
import { siteUrl } from "@/lib/format";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Tenfold · The daily world quiz", template: "%s · Tenfold" },
  description: "Ten questions. Fifteen seconds each. One shot a day against the whole world.",
  openGraph: { siteName: "Tenfold", type: "website" },
};

export const viewport: Viewport = { themeColor: "#07080D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-16 md:pt-10">{children}</main>
      </body>
    </html>
  );
}
