import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LandingPage } from "@/components/marketing/LandingPage"
import { isLandingLocale } from "@/lib/landing-locale"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLandingLocale(locale)) notFound()
  const title = locale === "id" ? "KLK Invoice — Invoice yang mengikuti cara kerja bisnis Anda" : "KLK Invoice — Invoicing that fits the way you work"
  const description = locale === "id"
    ? "Kelola transaksi, susun invoice, dan ekspor dokumen PDF dalam satu alur kerja. Kenali KLK Invoice dan rencana pengembangannya."
    : "Manage transactions, create invoices, and export PDFs in one organized workflow. Explore KLK Invoice and what we are building next."
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `/${locale}`, languages: { id: "/id", en: "/en", "x-default": "/" } },
    openGraph: {
      title, description, type: "website", siteName: "KLK Invoice", url: `/${locale}`,
      locale: locale === "id" ? "id_ID" : "en_US", alternateLocale: locale === "id" ? "en_US" : "id_ID",
      images: [{ url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/${locale}/opengraph-image`] },
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLandingLocale(locale)) notFound()
  return <LandingPage locale={locale} />
}
