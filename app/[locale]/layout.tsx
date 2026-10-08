import { notFound } from "next/navigation"
import Document, { metadata as baseMetadata } from "../shared-document"
import { isLandingLocale, locales } from "@/lib/landing-locale"
import "@/components/marketing/theme.css"

export const metadata = baseMetadata
export const dynamicParams = false
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LandingLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLandingLocale(locale)) notFound()
  return <Document lang={locale} landing>{children}</Document>
}
