import type { Metadata } from "next"
import { Toaster } from "sonner"
import Document, { metadata as baseMetadata } from "../../shared-document"
import { Providers } from "../../providers"
import { NavigationProgress } from "@/components/NavigationProgress"
import "@/components/marketing/theme.css"

export const metadata: Metadata = { ...baseMetadata, title: "Masuk", robots: { index: false, follow: false } }

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Document landing><Providers>{children}<Toaster position="top-right" richColors /><NavigationProgress /></Providers></Document>
}
