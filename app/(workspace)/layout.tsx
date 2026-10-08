import type { Metadata } from "next"
import { Toaster } from "sonner"
import { Providers } from "../providers"
import { NavigationProgress } from "@/components/NavigationProgress"
import Document, { metadata as baseMetadata } from "../shared-document"

export const metadata: Metadata = {
  ...baseMetadata,
  title: "Aplikasi",
  robots: { index: false, follow: false },
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Document>
      <Providers>
        {children}
        <Toaster position="top-right" richColors />
        <NavigationProgress />
      </Providers>
    </Document>
  )
}
