import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { NavigationProgress } from "@/components/NavigationProgress";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "KLK Invoice",
  description: "Dashboard Admin untuk Input Transaksi Ekspedisi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${instrumentSans.className} ${instrumentSans.variable} ${plexMono.variable}`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <NavigationProgress />
        </Providers>
      </body>
    </html>
  );
}

