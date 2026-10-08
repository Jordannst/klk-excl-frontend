import { ImageResponse } from "next/og"
import { notFound } from "next/navigation"
import { isLandingLocale } from "@/lib/landing-locale"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLandingLocale(locale)) notFound()
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "70px 82px", background: "linear-gradient(125deg, #fff 35%, #e4efff)", color: "#142039" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36 }}>
        <svg width="42" height="56" viewBox="0 0 64 84" fill="none">
          <path d="M24 3.5C24 .8 25.6-.2 28.2.8L59.5 12.4C62.5 13.5 64 15.5 64 18.7V67C64 69.1 62.9 69.8 60.8 69L51.3 65.3V25.6C51.3 23.8 50.6 23 48.6 22.2L24 13.1V3.5Z" fill="#142039" />
          <path d="M0 14.2C0 11.4 1.6 10.2 4.1 11.2L39.5 23.9L18.3 45.8L45.5 75.6V82C45.5 84 44.4 84.7 42.3 83.9L2.8 68.2C.9 67.4 0 66.2 0 64.2V14.2Z" fill="#2463eb" />
          <path d="M33 45.8L51.3 27.3V65.3L33 45.8Z" fill="#2463eb" />
        </svg>
        KLK Invoice
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 72, fontSize: 66, fontWeight: 700, letterSpacing: -2, lineHeight: 1.15 }}>
        <span>{locale === "id" ? "Invoice yang mengikuti" : "Invoicing that fits"}</span>
        <span style={{ color: "#2463eb" }}>{locale === "id" ? "cara kerja bisnis Anda." : "the way you work."}</span>
      </div>
      <div style={{ display: "flex", marginTop: 48, fontSize: 25, color: "#596779" }}>
        {locale === "id" ? "Kelola transaksi. Susun invoice. Ekspor PDF." : "Manage transactions. Create invoices. Export PDFs."}
      </div>
      <div style={{ display: "flex", marginTop: "auto", fontSize: 19 }}>klkinvoice.my.id</div>
    </div>, size,
  )
}
