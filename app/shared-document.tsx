import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { landingThemeScript } from "@/lib/landing-theme";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--klk-font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--klk-font-mono",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--klk-font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://klkinvoice.my.id"),
  title: { default: "KLK Invoice — Invoice yang mengikuti cara kerja bisnis Anda", template: "%s | KLK Invoice" },
  description: "Kelola transaksi, susun invoice, dan ekspor dokumen PDF dalam satu alur kerja. Kenali KLK Invoice dan rencana pengembangannya.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "KLK Invoice",
    title: "KLK Invoice — Administrasi rapi. Bisnis terus bergerak.",
    description: "Dari pencatatan transaksi hingga invoice siap dibagikan, kelola pekerjaan Anda dalam satu tempat.",
    images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "KLK Invoice — Kelola transaksi. Susun invoice. Ekspor PDF." }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export default function Document({
  children,
  lang = "id",
  landing = false,
}: Readonly<{
  children: React.ReactNode;
  lang?: "id" | "en";
  landing?: boolean;
}>) {
  return (
    <html lang={lang} data-landing={landing ? "" : undefined} suppressHydrationWarning={landing || undefined}>
      {landing && <head><script dangerouslySetInnerHTML={{ __html: landingThemeScript }} /></head>}
      <body className={`${instrumentSans.className} ${instrumentSans.variable} ${plexMono.variable} ${sourceSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}

